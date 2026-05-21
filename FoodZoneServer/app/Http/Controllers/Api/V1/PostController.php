<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\PostMedia;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    /** Personalised home feed: followed users + own posts + public posts. */
    public function feed(Request $request): JsonResponse
    {
        $me = $request->user();
        $followingIds = $me->following()->where('status', 'accepted')->pluck('following_id')->all();
        $blocked = $me->blockedUserIds();

        $posts = Post::query()
            ->with(['user.profile', 'media', 'likes' => fn ($q) => $q->where('user_id', $me->id)])
            ->whereNotIn('user_id', $blocked)
            ->where(function ($q) use ($followingIds, $me) {
                // Visibility: public to all; followers-only to followers/self; private to self.
                $q->where('privacy', PostPrivacy::Public->value)
                    ->orWhere('user_id', $me->id)
                    ->orWhere(function ($q2) use ($followingIds) {
                        $q2->where('privacy', PostPrivacy::Followers->value)
                            ->whereIn('user_id', $followingIds);
                    });
            })
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Feed loaded.');
    }

    /** Public explore feed (recent public posts), available without auth. */
    public function explore(Request $request): JsonResponse
    {
        $posts = Post::query()
            ->with(['user.profile', 'media'])
            ->where('privacy', PostPrivacy::Public->value)
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Explore feed loaded.');
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $this->assertCanView($request, $post);

        $post->load(['user.profile', 'media']);

        return ApiResponse::success(new PostResource($post), 'Post retrieved.');
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $me = $request->user();

        $post = DB::transaction(function () use ($request, $me) {
            $media = $request->input('media', []);

            $post = $me->posts()->create([
                'body' => $request->input('body'),
                'privacy' => $request->input('privacy', PostPrivacy::Public->value),
                'type' => empty($media) ? 'text' : ($media[0]['type'] ?? 'image'),
                'location' => $request->input('location'),
                'tagged_vendor_id' => $request->input('tagged_vendor_id'),
                'tagged_item_id' => $request->input('tagged_item_id'),
            ]);

            foreach ($media as $i => $m) {
                PostMedia::create([
                    'post_id' => $post->id,
                    'url' => $m['url'],
                    'type' => $m['type'] ?? 'image',
                    'sort_order' => $i,
                ]);
            }

            $me->profile()->increment('posts_count');

            return $post;
        });

        $post->load(['user.profile', 'media']);

        return ApiResponse::success(new PostResource($post), 'Post created.', 201);
    }

    public function update(StorePostRequest $request, Post $post): JsonResponse
    {
        $this->assertOwner($request, $post);

        $post->update($request->only(['body', 'privacy', 'location']));
        $post->load(['user.profile', 'media']);

        return ApiResponse::success(new PostResource($post), 'Post updated.');
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->assertOwner($request, $post);

        DB::transaction(function () use ($post, $request) {
            $post->delete();
            $request->user()->profile()->where('posts_count', '>', 0)->decrement('posts_count');
        });

        return ApiResponse::success(null, 'Post deleted.');
    }

    public function like(Request $request, Post $post): JsonResponse
    {
        $me = $request->user();

        $like = $post->likes()->firstOrCreate(['user_id' => $me->id]);

        if ($like->wasRecentlyCreated) {
            $post->increment('likes_count');
            if ($post->user_id !== $me->id) {
                app(\App\Services\NotificationService::class)->notify(
                    $post->user_id,
                    'like',
                    'New like',
                    "{$me->username} liked your post.",
                    ['post_id' => $post->id],
                    actor: $me,
                );
            }
        }

        return ApiResponse::success(['likes_count' => $post->fresh()->likes_count], 'Post liked.');
    }

    public function unlike(Request $request, Post $post): JsonResponse
    {
        $deleted = $post->likes()->where('user_id', $request->user()->id)->delete();

        if ($deleted) {
            $post->where('likes_count', '>', 0)->decrement('likes_count');
        }

        return ApiResponse::success(['likes_count' => $post->fresh()->likes_count], 'Post unliked.');
    }

    // ----------------------------------------------------------------
    // Authorization helpers
    // ----------------------------------------------------------------

    private function assertOwner(Request $request, Post $post): void
    {
        if ($post->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403, 'You can only modify your own posts.');
        }
    }

    private function assertCanView(Request $request, Post $post): void
    {
        $me = $request->user();

        // Guests may only view public posts.
        if (! $me) {
            if ($post->privacy?->value === PostPrivacy::Public->value) {
                return;
            }
            abort(403, 'This post is private.');
        }

        if ($post->user_id === $me->id || $me->isAdmin()) {
            return;
        }

        if ($me->hasBlocked($post->user_id) || $post->user->hasBlocked($me->id)) {
            abort(404, 'Resource not found.');
        }

        $privacy = $post->privacy?->value;

        if ($privacy === PostPrivacy::Public->value) {
            return;
        }

        if ($privacy === PostPrivacy::Followers->value && $me->isFollowing($post->user_id)) {
            return;
        }

        abort(403, 'This post is private.');
    }
}
