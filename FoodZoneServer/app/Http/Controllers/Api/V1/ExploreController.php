<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserSummaryResource;
use App\Http\Resources\VendorResource;
use App\Models\Follow;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExploreController extends Controller
{
    /** Curated discovery payload — six sections in one request. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        // Trending sections + hashtags are global — same for everyone and
        // expensive to compute. Cache them as one chunk for 60s.
        $shared = Cache::remember('explore:shared', 60, fn () => [
            'trending_vendors' => $this->trendingVendors(),
            'trending_hashtags' => $this->trendingHashtags(),
            'trending_items' => $this->trendingItems(),
        ]);

        $payload = [
            'trending_posts' => $this->trendingPosts($me),
            'trending_vendors' => $shared['trending_vendors'],
            'trending_hashtags' => $shared['trending_hashtags'],
            'trending_items' => $shared['trending_items'],
            'suggested_users' => $me ? $this->suggestedUsers($me) : [],
            'nearby_vendors' => $this->nearbyVendors($request),
        ];

        return ApiResponse::success($payload, 'Explore loaded.');
    }

    /** Approved vendors with coordinates — for embedded map view. */
    public function map(): JsonResponse
    {
        $vendors = Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->limit(500)
            ->get(['id', 'name', 'slug', 'logo', 'lat', 'lng', 'rating_avg', 'is_open', 'is_featured']);

        return ApiResponse::success($vendors, 'Map vendors loaded.');
    }

    // ----------------------------------------------------------------
    // Section builders
    // ----------------------------------------------------------------

    /** Top public posts by weighted engagement over the last 6 hours. */
    private function trendingPosts(?User $me): array
    {
        $posts = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('created_at', '>=', now()->subHours(6))
            ->with(['user.profile', 'media'])
            ->when($me, fn ($q) => $q
                ->with(['likes' => fn ($l) => $l->where('user_id', $me->id)])
                ->withExists(['savedBy as is_saved' => fn ($s) => $s->where('user_id', $me->id)]))
            ->orderByRaw('(likes_count + comments_count * 2 + shares_count * 3) DESC')
            ->latest()
            ->limit(12)
            ->get();

        return PostResource::collection($posts)->resolve();
    }

    /** Approved vendors ranked by orders-in-last-24h with delta vs the prior 24h. */
    private function trendingVendors(): array
    {
        $now = now();
        $since = (clone $now)->subDay();
        $priorSince = (clone $now)->subDays(2);

        $recent = Order::query()
            ->where('created_at', '>=', $since)
            ->selectRaw('vendor_id, COUNT(*) as orders_24h')
            ->groupBy('vendor_id')
            ->orderByDesc('orders_24h')
            ->limit(10)
            ->get();

        if ($recent->isEmpty()) {
            return [];
        }

        $vendorIds = $recent->pluck('vendor_id')->all();

        $prior = Order::query()
            ->whereIn('vendor_id', $vendorIds)
            ->whereBetween('created_at', [$priorSince, $since])
            ->selectRaw('vendor_id, COUNT(*) as orders_prior')
            ->groupBy('vendor_id')
            ->pluck('orders_prior', 'vendor_id');

        $vendors = Vendor::query()
            ->whereIn('id', $vendorIds)
            ->where('status', VendorStatus::Approved->value)
            ->get()
            ->keyBy('id');

        $payload = [];
        foreach ($recent as $row) {
            $vendor = $vendors->get($row->vendor_id);
            if (! $vendor) continue;

            $orders24h = (int) $row->orders_24h;
            $ordersPrior = (int) ($prior[$row->vendor_id] ?? 0);
            $delta = $ordersPrior > 0
                ? round((($orders24h - $ordersPrior) / $ordersPrior) * 100)
                : ($orders24h > 0 ? 100 : 0);

            $payload[] = [
                'vendor' => (new VendorResource($vendor))->resolve(request()),
                'orders_24h' => $orders24h,
                'order_delta' => (int) $delta,
            ];
        }

        return $payload;
    }

    /** Top hashtags by post-count over the last 24 hours (regex over bodies). */
    private function trendingHashtags(): array
    {
        $bodies = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('created_at', '>=', now()->subDay())
            ->whereNotNull('body')
            ->latest()
            ->limit(1000)
            ->pluck('body');

        $counts = [];
        foreach ($bodies as $body) {
            preg_match_all('/#(\w+)/u', (string) $body, $m);
            foreach ($m[1] as $tag) {
                $key = mb_strtolower($tag);
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }
        arsort($counts);

        $top = array_slice($counts, 0, 10, true);
        $payload = [];
        foreach ($top as $tag => $count) {
            $payload[] = ['tag' => $tag, 'count' => $count];
        }

        return $payload;
    }

    /** Globally most-ordered menu items in the last 24 hours. */
    private function trendingItems(): array
    {
        $rows = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('created_at', '>=', now()->subDay()))
            ->whereNotNull('item_id')
            ->selectRaw('item_id, SUM(quantity) as recent_orders')
            ->groupBy('item_id')
            ->orderByDesc('recent_orders')
            ->limit(10)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $items = MenuItem::query()
            ->whereIn('id', $rows->pluck('item_id'))
            ->with(['variants', 'addons', 'images'])
            ->get()
            ->keyBy('id');

        $payload = [];
        foreach ($rows as $row) {
            $item = $items->get($row->item_id);
            if (! $item) continue;

            $payload[] = [
                'item' => (new MenuItemResource($item))->resolve(request()),
                'recent_orders' => (int) $row->recent_orders,
            ];
        }

        return $payload;
    }

    /** Friends-of-friends — accounts followed by people you follow, scored by mutual count. */
    private function suggestedUsers(User $me): array
    {
        $following = $me->following()
            ->where('status', 'accepted')
            ->pluck('following_id')
            ->all();

        if (empty($following)) {
            // Fallback: most-followed users you're not already following.
            $candidates = User::query()
                ->whereNotIn('id', array_merge([$me->id], $me->blockedUserIds()))
                ->withCount(['followers as followers_count' => fn ($q) => $q->where('status', 'accepted')])
                ->with('profile')
                ->orderByDesc('followers_count')
                ->limit(10)
                ->get();

            return $candidates->map(fn ($u) => [
                'user' => (new UserSummaryResource($u))->resolve(request()),
                'mutual_count' => 0,
                'reason' => 'popular',
            ])->all();
        }

        $exclude = array_merge($following, [$me->id], $me->blockedUserIds());

        // Count how many of my followees follow each candidate.
        $rows = Follow::query()
            ->whereIn('follower_id', $following)
            ->whereNotIn('following_id', $exclude)
            ->where('status', 'accepted')
            ->selectRaw('following_id, COUNT(*) as mutual_count')
            ->groupBy('following_id')
            ->orderByDesc('mutual_count')
            ->limit(10)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $users = User::query()
            ->whereIn('id', $rows->pluck('following_id'))
            ->with('profile')
            ->get()
            ->keyBy('id');

        $payload = [];
        foreach ($rows as $row) {
            $user = $users->get($row->following_id);
            if (! $user) continue;

            $payload[] = [
                'user' => (new UserSummaryResource($user))->resolve(request()),
                'mutual_count' => (int) $row->mutual_count,
                'reason' => 'mutuals',
            ];
        }

        return $payload;
    }

    /** Vendors within radius of (lat,lng) if both query params are present. PHP Haversine. */
    private function nearbyVendors(Request $request): array
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if ($lat === null || $lng === null || ! is_numeric($lat) || ! is_numeric($lng)) {
            return [];
        }

        $radius = (float) ($request->query('radius', 10));
        $radius = max(0.5, min(50, $radius));

        $candidates = Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->get();

        $lat0 = deg2rad((float) $lat);
        $lng0 = deg2rad((float) $lng);

        return $candidates
            ->map(function (Vendor $v) use ($lat0, $lng0) {
                $lat1 = deg2rad((float) $v->lat);
                $lng1 = deg2rad((float) $v->lng);
                $a = sin(($lat1 - $lat0) / 2) ** 2
                    + cos($lat0) * cos($lat1) * sin(($lng1 - $lng0) / 2) ** 2;
                $v->setAttribute('distance_km', round(6371 * 2 * asin(min(1.0, sqrt($a))), 3));
                return $v;
            })
            ->filter(fn (Vendor $v) => $v->distance_km <= $radius)
            ->sortBy('distance_km')
            ->take(10)
            ->values()
            ->map(fn (Vendor $v) => array_merge(
                (new VendorResource($v))->resolve(request()),
                ['distance_km' => $v->distance_km]
            ))
            ->all();
    }
}
