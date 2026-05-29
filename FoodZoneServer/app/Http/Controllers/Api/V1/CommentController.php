<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Post;
use App\Models\PostComment;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    /** Top-level comments for a post, each with its nested replies. */
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with(['user.profile', 'replies.user.profile'])
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($comments, CommentResource::class, 'Comments loaded.');
    }

    public function store(Request $request, Post $post, NotificationService $notifications): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:post_comments,id'],
        ]);

        // Enforce single-level nesting (a reply cannot have a reply).
        if (! empty($data['parent_id'])) {
            $parent = PostComment::findOrFail($data['parent_id']);
            if ($parent->post_id !== $post->id) {
                return ApiResponse::error('Parent comment does not belong to this post.', 422);
            }
            if ($parent->parent_id !== null) {
                return ApiResponse::error('Replies can only be one level deep.', 422);
            }
        }

        $me = $request->user();

        $comment = DB::transaction(function () use ($post, $me, $data, $notifications) {
            $comment = $post->comments()->create([
                'user_id' => $me->id,
                'parent_id' => $data['parent_id'] ?? null,
                'body' => $data['body'],
            ]);

            $post->increment('comments_count');

            if (! empty($data['parent_id'])) {
                PostComment::where('id', $data['parent_id'])->increment('replies_count');
            }

            if ($post->user_id !== $me->id) {
                $notifications->notify(
                    $post->user_id,
                    'comment',
                    'New comment',
                    "{$me->username} commented on your post.",
                    ['post_id' => $post->id, 'comment_id' => $comment->id],
                    actor: $me,
                );
            }

            return $comment;
        });

        return ApiResponse::success(
            new CommentResource($comment->load('user.profile')),
            'Comment added.',
            201
        );
    }

    /** Open a moderation violation for a comment (used by /comments/{comment}/report). */
    public function report(Request $request, PostComment $comment): JsonResponse
    {
        if ($comment->user_id === $request->user()->id) {
            return ApiResponse::error('You cannot report your own comment.', 422);
        }
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:50'],
            'detail' => ['nullable', 'string', 'max:2000'],
        ]);

        \App\Models\Violation::create([
            'user_id' => $comment->user_id,
            'type' => $data['reason'],
            'evidence' => $data['detail'] ?? null,
            'severity' => 'medium',
            'status' => 'open',
            'subject_type' => PostComment::class,
            'subject_id' => $comment->id,
            'reported_by' => $request->user()->id,
        ]);

        return ApiResponse::success(null, 'Report submitted. Thank you.', 201);
    }

    public function destroy(Request $request, PostComment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403, 'You can only delete your own comments.');
        }

        DB::transaction(function () use ($comment) {
            $post = $comment->post;
            $repliesRemoved = $comment->replies()->count();

            $comment->delete(); // cascades replies via FK

            $post->where('comments_count', '>', 0)
                ->decrement('comments_count', 1 + $repliesRemoved);

            if ($comment->parent_id !== null) {
                PostComment::where('id', $comment->parent_id)
                    ->where('replies_count', '>', 0)
                    ->decrement('replies_count');
            }
        });

        return ApiResponse::success(null, 'Comment deleted.');
    }
}
