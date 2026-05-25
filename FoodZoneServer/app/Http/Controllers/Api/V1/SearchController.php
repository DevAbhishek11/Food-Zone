<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserSummaryResource;
use App\Http\Resources\VendorResource;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Global search across people, restaurants and posts.
     * `?q=term` returns a combined top-results bundle; add `&type=users|vendors|posts`
     * for a paginated single-type result set.
     */
    public function index(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));
        $type = $request->query('type');

        if (mb_strlen($term) < 2) {
            return $type
                ? ApiResponse::error('Enter at least 2 characters to search.', 422)
                : ApiResponse::success(['users' => [], 'vendors' => [], 'posts' => []], 'Search.');
        }

        $blocked = $request->user()?->blockedUserIds() ?? [];

        if ($this->useScout()) {
            return $this->scoutSearch($term, $type, $blocked);
        }

        return match ($type) {
            'users' => ApiResponse::paginated($this->users($term, $blocked)->paginate(15), UserSummaryResource::class, 'People.'),
            'vendors' => ApiResponse::paginated($this->vendors($term)->paginate(15), VendorResource::class, 'Restaurants.'),
            'posts' => ApiResponse::paginated($this->posts($term, $blocked, $request)->paginate(15), PostResource::class, 'Posts.'),
            default => ApiResponse::success([
                'users' => UserSummaryResource::collection($this->users($term, $blocked)->limit(5)->get()),
                'vendors' => VendorResource::collection($this->vendors($term)->limit(5)->get()),
                'posts' => PostResource::collection($this->posts($term, $blocked, $request)->limit(5)->get()),
            ], 'Search results.'),
        };
    }

    /** Whether a real search engine (Meilisearch) is configured. */
    private function useScout(): bool
    {
        return config('scout.driver') === 'meilisearch';
    }

    /**
     * Scout/Meilisearch-powered search. Approved-vendor / public-post scoping is
     * enforced at index time via each model's shouldBeSearchable(); blocked users
     * are excluded when hydrating results.
     */
    private function scoutSearch(string $term, ?string $type, array $blocked): JsonResponse
    {
        $userQuery = fn () => User::search($term)->query(fn ($q) => $q->with('profile')->whereNotIn('id', $blocked));
        $vendorQuery = fn () => Vendor::search($term);
        $postQuery = fn () => Post::search($term)->query(fn ($q) => $q->with(['user.profile', 'media'])->whereNotIn('user_id', $blocked));

        return match ($type) {
            'users' => ApiResponse::paginated($userQuery()->paginate(15), UserSummaryResource::class, 'People.'),
            'vendors' => ApiResponse::paginated($vendorQuery()->paginate(15), VendorResource::class, 'Restaurants.'),
            'posts' => ApiResponse::paginated($postQuery()->paginate(15), PostResource::class, 'Posts.'),
            default => ApiResponse::success([
                'users' => UserSummaryResource::collection($userQuery()->take(5)->get()),
                'vendors' => VendorResource::collection($vendorQuery()->take(5)->get()),
                'posts' => PostResource::collection($postQuery()->take(5)->get()),
            ], 'Search results.'),
        };
    }

    private function users(string $term, array $blocked): Builder
    {
        $like = '%'.$this->escape($term).'%';

        return User::query()
            ->with('profile')
            ->whereNotIn('id', $blocked)
            ->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('username', 'like', $like));
    }

    private function vendors(string $term): Builder
    {
        $like = '%'.$this->escape($term).'%';

        return Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->where(fn ($q) => $q->where('name', 'like', $like)
                ->orWhere('city', 'like', $like)
                ->orWhere('description', 'like', $like))
            ->orderByDesc('rating_avg');
    }

    private function posts(string $term, array $blocked, Request $request): Builder
    {
        $like = '%'.$this->escape($term).'%';
        $meId = $request->user()?->id;

        return Post::query()
            ->with(['user.profile', 'media', 'likes' => fn ($q) => $meId ? $q->where('user_id', $meId) : $q->whereRaw('1 = 0')])
            ->where('privacy', PostPrivacy::Public->value)
            ->whereNotIn('user_id', $blocked)
            ->where('body', 'like', $like)
            ->latest();
    }

    /** Escape LIKE wildcards in user input. */
    private function escape(string $term): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $term);
    }
}
