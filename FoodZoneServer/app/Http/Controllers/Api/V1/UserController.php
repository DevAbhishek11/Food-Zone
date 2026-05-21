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

        return ApiResponse::success($payload, 'User profile retrieved.');
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
