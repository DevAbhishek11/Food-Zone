<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\Post;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function show(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', $username)->with('profile')->firstOrFail();
        $me = $request->user();

        $payload = (new UserResource($user))->resolve($request);
        $payload['is_following'] = $me ? $me->isFollowing($user->id) : false;
        $payload['is_blocked'] = $me ? $me->hasBlocked($user->id) : false;
        $payload['follows_me'] = $me ? $user->isFollowing($me->id) : false;
        $payload['member_since'] = $user->created_at?->format('F Y');
        $payload['top_food_tags'] = $this->topFoodTags($user->id);
        $payload['mutual_followers'] = $me && $me->id !== $user->id ? $this->mutualFollowers($me, $user) : [];

        return ApiResponse::success($payload, 'User profile retrieved.');
    }

    /** Posts by this user that tag a vendor or menu item — their "food journey". */
    public function foodJourney(Request $request, string $username): JsonResponse
    {
        $target = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        if ($me && ($me->hasBlocked($target->id) || $target->hasBlocked($me->id))) {
            abort(404, 'Resource not found.');
        }

        $isSelf = $me && $me->id === $target->id;
        $isFollowing = $me ? $me->isFollowing($target->id) : false;

        $posts = Post::query()
            ->where('user_id', $target->id)
            ->where(fn ($q) => $q->whereNotNull('tagged_vendor_id')->orWhereNotNull('tagged_item_id'))
            ->where(function ($q) use ($isSelf, $isFollowing) {
                if ($isSelf) return;
                $q->where('privacy', PostPrivacy::Public->value);
                if ($isFollowing) $q->orWhere('privacy', PostPrivacy::Followers->value);
            })
            ->with(['user.profile', 'media', 'taggedVendor'])
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Food journey loaded.');
    }

    /** Public posts that @mention this user in the body. */
    public function taggedIn(Request $request, string $username): JsonResponse
    {
        $target = User::where('username', $username)->firstOrFail();

        $posts = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('body', 'like', '%@'.$target->username.'%')
            ->where('user_id', '!=', $target->id)
            ->with(['user.profile', 'media'])
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Tagged posts loaded.');
    }

    /** Top 5 hashtags this user has used across their public posts. */
    private function topFoodTags(int $userId): array
    {
        $bodies = Post::where('user_id', $userId)
            ->where('privacy', PostPrivacy::Public->value)
            ->whereNotNull('body')
            ->latest()
            ->limit(200)
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

        return array_slice(array_keys($counts), 0, 5);
    }

    /** Up to 3 followers shared between the viewer and the target user. */
    private function mutualFollowers(User $me, User $target): array
    {
        $myFollowing = $me->following()->where('status', 'accepted')->pluck('following_id');
        $theirFollowers = $target->followers()->where('status', 'accepted')->pluck('follower_id');
        $ids = $myFollowing->intersect($theirFollowers)->take(3)->all();
        if (empty($ids)) return [];

        return User::whereIn('id', $ids)->with('profile')->get()
            ->map(fn ($u) => ['id' => $u->id, 'username' => $u->username, 'name' => $u->name, 'avatar' => $u->profile?->avatar])
            ->all();
    }

    /** A user's posts, respecting privacy relative to the viewer. */
    public function posts(Request $request, string $username): JsonResponse
    {
        $target = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        $isSelf = $me && $me->id === $target->id;
        $isAdmin = $me && $me->isAdmin();

        if ($me && ($me->hasBlocked($target->id) || $target->hasBlocked($me->id))) {
            abort(404, 'Resource not found.');
        }

        $isFollowing = $me ? $me->isFollowing($target->id) : false;

        $posts = Post::query()
            ->where('user_id', $target->id)
            ->with(['user.profile', 'media', 'likes' => fn ($q) => $me ? $q->where('user_id', $me->id) : $q->whereRaw('1 = 0')])
            ->where(function ($q) use ($isSelf, $isAdmin, $isFollowing) {
                if ($isSelf || $isAdmin) {
                    return; // see everything
                }
                $q->where('privacy', PostPrivacy::Public->value);
                if ($isFollowing) {
                    $q->orWhere('privacy', PostPrivacy::Followers->value);
                }
            })
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'User posts loaded.');
    }

    public function follow(Request $request, User $user, NotificationService $notifications): JsonResponse
    {
        $me = $request->user();

        if ($me->id === $user->id) {
            return ApiResponse::error('You cannot follow yourself.', 422);
        }

        if ($me->hasBlocked($user->id) || $user->hasBlocked($me->id)) {
            return ApiResponse::error('You cannot follow this user.', 403);
        }

        $isPrivate = (bool) optional($user->profile)->is_private;
        $status = $isPrivate ? 'pending' : 'accepted';

        $follow = $me->following()->firstOrCreate(
            ['following_id' => $user->id],
            ['status' => $status],
        );

        if ($follow->wasRecentlyCreated && $status === 'accepted') {
            $this->syncFollowCounts($me->id, $user->id);
            $notifications->notify($user->id, 'follow', 'New follower',
                "{$me->username} started following you.", [], actor: $me);
        } elseif ($follow->wasRecentlyCreated) {
            $notifications->notify($user->id, 'follow_request', 'Follow request',
                "{$me->username} requested to follow you.", [], actor: $me);
        }

        return ApiResponse::success(['status' => $follow->status], 'Follow recorded.');
    }

    public function unfollow(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        $follow = $me->following()->where('following_id', $user->id)->first();

        if ($follow) {
            $wasAccepted = $follow->status === 'accepted';
            $follow->delete();
            if ($wasAccepted) {
                $this->syncFollowCounts($me->id, $user->id, decrement: true);
            }
        }

        return ApiResponse::success(null, 'Unfollowed.');
    }

    public function followers(User $user): JsonResponse
    {
        $followers = User::query()
            ->whereIn('id', $user->followers()->where('status', 'accepted')->select('follower_id'))
            ->with('profile')
            ->paginate(20);

        return ApiResponse::paginated($followers, UserSummaryResource::class, 'Followers loaded.');
    }

    public function following(User $user): JsonResponse
    {
        $following = User::query()
            ->whereIn('id', $user->following()->where('status', 'accepted')->select('following_id'))
            ->with('profile')
            ->paginate(20);

        return ApiResponse::paginated($following, UserSummaryResource::class, 'Following loaded.');
    }

    public function block(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if ($me->id === $user->id) {
            return ApiResponse::error('You cannot block yourself.', 422);
        }

        DB::transaction(function () use ($me, $user) {
            $me->blocks()->firstOrCreate(['blocked_id' => $user->id]);
            // Remove any follow relationship in both directions.
            $me->following()->where('following_id', $user->id)->delete();
            $me->followers()->where('follower_id', $user->id)->delete();
            $this->recalcCounts($me->id);
            $this->recalcCounts($user->id);
        });

        return ApiResponse::success(null, 'User blocked.');
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        $request->user()->blocks()->where('blocked_id', $user->id)->delete();

        return ApiResponse::success(null, 'User unblocked.');
    }

    /** Open a moderation violation against a user (no content subject). */
    public function report(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return ApiResponse::error('You cannot report yourself.', 422);
        }
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:50'],
            'detail' => ['nullable', 'string', 'max:2000'],
        ]);

        \App\Models\Violation::create([
            'user_id' => $user->id,
            'type' => $data['reason'],
            'evidence' => $data['detail'] ?? null,
            'severity' => 'medium',
            'status' => 'open',
            'reported_by' => $request->user()->id,
        ]);

        return ApiResponse::success(null, 'Report submitted. Thank you.', 201);
    }

    // ----------------------------------------------------------------

    private function syncFollowCounts(int $followerId, int $followingId, bool $decrement = false): void
    {
        $this->recalcCounts($followerId);
        $this->recalcCounts($followingId);
    }

    /** Recompute denormalised follower/following counts from the source of truth. */
    private function recalcCounts(int $userId): void
    {
        $user = User::find($userId);
        if (! $user) {
            return;
        }
        $user->profile()->updateOrCreate(['user_id' => $userId], [
            'followers_count' => $user->followers()->where('status', 'accepted')->count(),
            'following_count' => $user->following()->where('status', 'accepted')->count(),
        ]);
    }
}
