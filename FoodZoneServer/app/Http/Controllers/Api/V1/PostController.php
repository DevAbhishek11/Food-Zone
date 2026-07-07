<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\PostShare;
use App\Models\SavedPost;
use App\Models\User;
use App\Services\NotificationService;
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
            ->withExists(['savedBy as is_saved' => fn ($q) => $q->where('user_id', $me->id)])
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

        // Label provenance so clients can badge "Suggested" vs followed content.
        $followingSet = array_flip($followingIds);
        $posts->getCollection()->each(function ($p) use ($followingSet, $me) {
            $p->source = ($p->user_id === $me->id || isset($followingSet[$p->user_id])) ? 'following' : 'suggested';
        });

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
        if ($me = $request->user()) {
            $post->setAttribute('is_saved', $post->savedBy()->where('user_id', $me->id)->exists());
        }

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

    /** Posts from people you don't follow yet, ranked by engagement. */
    public function suggested(Request $request): JsonResponse
    {
        $me = $request->user();
        $exclude = array_merge(
            $me->following()->where('status', 'accepted')->pluck('following_id')->all(),
            [$me->id],
            $me->blockedUserIds(),
        );

        $posts = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->whereNotIn('user_id', $exclude)
            ->with(['user.profile', 'media', 'likes' => fn ($q) => $q->where('user_id', $me->id)])
            ->withExists(['savedBy as is_saved' => fn ($q) => $q->where('user_id', $me->id)])
            ->orderByRaw('(likes_count + comments_count * 2 + shares_count * 3) DESC')
            ->latest()
            ->paginate(15);

        $posts->getCollection()->each(fn ($p) => $p->source = 'suggested');

        return ApiResponse::paginated($posts, PostResource::class, 'Suggested posts loaded.');
    }

    /** Most-engaged public posts in the last N hours. */
    public function trending(Request $request): JsonResponse
    {
        $hours = min(max((int) $request->query('hours', 6), 1), 168);
        $me = $request->user();

        $posts = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('created_at', '>=', now()->subHours($hours))
            ->with(['user.profile', 'media'])
            ->when($me, fn ($q) => $q
                ->with(['likes' => fn ($l) => $l->where('user_id', $me->id)])
                ->withExists(['savedBy as is_saved' => fn ($s) => $s->where('user_id', $me->id)]))
            ->orderByRaw('(likes_count + comments_count * 2 + shares_count * 3) DESC')
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Trending posts loaded.');
    }

    /** Toggle pinning one of your own posts to your profile (max 3 pinned). */
    public function pin(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id !== $request->user()->id) {
            abort(403, 'You can only pin your own posts.');
        }

        if (! $post->is_pinned) {
            $pinned = Post::where('user_id', $request->user()->id)->where('is_pinned', true)->count();
            if ($pinned >= 3) {
                return ApiResponse::error('You can pin at most 3 posts. Unpin one first.', 422);
            }
        }

        $post->update(['is_pinned' => ! $post->is_pinned]);

        return ApiResponse::success(
            ['is_pinned' => (bool) $post->is_pinned],
            $post->is_pinned ? 'Post pinned to your profile.' : 'Post unpinned.',
        );
    }

    /** Bookmark a post. */
    public function save(Request $request, Post $post): JsonResponse
    {
        SavedPost::firstOrCreate(['user_id' => $request->user()->id, 'post_id' => $post->id]);

        return ApiResponse::success(null, 'Post saved.', 201);
    }

    public function unsave(Request $request, Post $post): JsonResponse
    {
        SavedPost::where('user_id', $request->user()->id)->where('post_id', $post->id)->delete();

        return ApiResponse::success(null, 'Post removed from saved.');
    }

    /** The current user's bookmarked posts. */
    public function saved(Request $request): JsonResponse
    {
        $me = $request->user();

        $posts = Post::query()
            ->whereIn('id', SavedPost::where('user_id', $me->id)->select('post_id'))
            ->with(['user.profile', 'media', 'likes' => fn ($q) => $q->where('user_id', $me->id)])
            ->withExists(['savedBy as is_saved' => fn ($q) => $q->where('user_id', $me->id)])
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, 'Saved posts loaded.');
    }

    /** Record a share (idempotent per user) and bump the counter. */
    public function share(Request $request, Post $post): JsonResponse
    {
        $me = $request->user();
        $share = PostShare::firstOrCreate(['user_id' => $me->id, 'post_id' => $post->id]);

        if ($share->wasRecentlyCreated) {
            $post->increment('shares_count');
            if ($post->user_id !== $me->id) {
                app(NotificationService::class)->notify(
                    $post->user_id,
                    'share',
                    'Post shared',
                    "{$me->username} shared your post.",
                    ['post_id' => $post->id],
                    actor: $me,
                );
            }
        }

        return ApiResponse::success(['shares_count' => $post->fresh()->shares_count], 'Post shared.');
    }

    public function shares(Post $post): JsonResponse
    {
        $users = User::whereIn('id', $post->shares()->select('user_id'))->with('profile')->paginate(20);

        return ApiResponse::paginated($users, UserSummaryResource::class, 'Shares loaded.');
    }

    public function likedBy(Post $post): JsonResponse
    {
        $users = User::whereIn('id', $post->likes()->select('user_id'))->with('profile')->paginate(20);

        return ApiResponse::paginated($users, UserSummaryResource::class, 'Likers loaded.');
    }

    /** Open a moderation violation for a post (used by /posts/{post}/report). */
    public function report(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id === $request->user()->id) {
            return ApiResponse::error('You cannot report your own post.', 422);
        }
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:50'],
            'detail' => ['nullable', 'string', 'max:2000'],
        ]);

        \App\Models\Violation::create([
            'user_id' => $post->user_id,
            'type' => $data['reason'],
            'evidence' => $data['detail'] ?? null,
            'severity' => 'medium',
            'status' => 'open',
            'subject_type' => Post::class,
            'subject_id' => $post->id,
            'reported_by' => $request->user()->id,
        ]);

        return ApiResponse::success(null, 'Report submitted. Thank you.', 201);
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
