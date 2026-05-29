<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderRating;
use App\Models\UserBadge;
use App\Services\LoyaltyService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(private LoyaltyService $loyalty) {}

    /** Caller's loyalty snapshot: points, tier, unlocked + locked badges. */
    public function me(Request $request): JsonResponse
    {
        $me = $request->user();
        $this->loyalty->checkBadges($me);
        $balance = $this->loyalty->balanceFor($me->id);

        $earned = UserBadge::where('user_id', $me->id)
            ->with('badge')
            ->get()
            ->keyBy('badge_id');

        $catalog = Badge::orderBy('threshold')->get()->map(fn (Badge $b) => [
            'key' => $b->key,
            'name' => $b->name,
            'description' => $b->description,
            'icon' => $b->icon,
            'unlocked' => $earned->has($b->id),
            'awarded_at' => $earned->get($b->id)?->awarded_at?->toIso8601String(),
        ]);

        $recent = LoyaltyTransaction::where('user_id', $me->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (LoyaltyTransaction $t) => [
                'id' => $t->id,
                'amount' => $t->amount,
                'reason' => $t->reason,
                'order_id' => $t->order_id,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return ApiResponse::success([
            'points' => $balance->points,
            'lifetime_points' => $balance->lifetime_points,
            'tier' => $balance->tier,
            'next_tier' => $this->nextTier($balance->lifetime_points),
            'badges' => $catalog,
            'recent_transactions' => $recent,
        ], 'Loyalty snapshot.');
    }

    /** Top-50 users ranked by a chosen metric. */
    public function leaderboard(Request $request): JsonResponse
    {
        $type = $request->query('type', 'points');
        $type = in_array($type, ['points', 'orders', 'reviews'], true) ? $type : 'points';

        $rows = match ($type) {
            'points' => \DB::table('user_loyalty')
                ->join('users', 'users.id', '=', 'user_loyalty.user_id')
                ->select('users.id', 'users.name', 'users.username', 'user_loyalty.lifetime_points as score')
                ->orderByDesc('user_loyalty.lifetime_points')
                ->limit(50)
                ->get(),
            'orders' => Order::query()
                ->where('orders.status', 'delivered')
                ->join('users', 'users.id', '=', 'orders.user_id')
                ->select('users.id', 'users.name', 'users.username', \DB::raw('COUNT(orders.id) as score'))
                ->groupBy('users.id', 'users.name', 'users.username')
                ->orderByDesc('score')
                ->limit(50)
                ->get(),
            'reviews' => OrderRating::query()
                ->join('users', 'users.id', '=', 'order_ratings.user_id')
                ->select('users.id', 'users.name', 'users.username', \DB::raw('COUNT(order_ratings.id) as score'))
                ->groupBy('users.id', 'users.name', 'users.username')
                ->orderByDesc('score')
                ->limit(50)
                ->get(),
        };

        return ApiResponse::success([
            'type' => $type,
            'entries' => $rows->map(fn ($r, $i) => [
                'rank' => $i + 1,
                'user' => ['id' => $r->id, 'name' => $r->name, 'username' => $r->username],
                'score' => (int) $r->score,
            ])->values(),
        ], 'Leaderboard.');
    }

    private function nextTier(int $lifetime): ?array
    {
        $tiers = \App\Models\UserLoyalty::TIERS;
        foreach ($tiers as $name => $floor) {
            if ($lifetime < $floor) {
                return ['name' => $name, 'points_to_go' => $floor - $lifetime];
            }
        }
        return null; // Already at platinum.
    }
}
