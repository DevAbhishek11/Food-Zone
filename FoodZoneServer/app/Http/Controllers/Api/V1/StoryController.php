<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StoryResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\Story;
use App\Models\StoryView;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StoryController extends Controller
{
    /** Active stories from people you follow (+ your own), grouped by user. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();
        $userIds = array_merge(
            $me->following()->where('status', 'accepted')->pluck('following_id')->all(),
            [$me->id],
        );

        $stories = Story::active()
            ->whereIn('user_id', $userIds)
            ->with('user.profile')
            ->withCount('views')
            ->oldest()
            ->get();

        $seenStoryIds = StoryView::where('user_id', $me->id)
            ->whereIn('story_id', $stories->pluck('id'))
            ->pluck('story_id')
            ->flip();

        $groups = $stories->groupBy('user_id')->map(function ($group) use ($seenStoryIds, $me) {
            return [
                'user' => new UserSummaryResource($group->first()->user),
                'is_mine' => $group->first()->user_id === $me->id,
                'has_unseen' => $group->contains(fn ($s) => ! $seenStoryIds->has($s->id)),
                'stories' => StoryResource::collection($group),
            ];
        })->values();

        return ApiResponse::success($groups, 'Stories loaded.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'media_url' => ['required', 'string', 'max:2048'],
            'type' => ['nullable', Rule::in(['image', 'video'])],
            'caption' => ['nullable', 'string', 'max:255'],
        ]);

        $story = $request->user()->stories()->create([
            'media_url' => $data['media_url'],
            'type' => $data['type'] ?? 'image',
            'caption' => $data['caption'] ?? null,
            'expires_at' => now()->addDay(),
        ]);

        return ApiResponse::success(new StoryResource($story), 'Story posted.', 201);
    }

    public function destroy(Request $request, Story $story): JsonResponse
    {
        if ($story->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own stories.');
        }
        $story->delete();

        return ApiResponse::success(null, 'Story deleted.');
    }

    public function view(Request $request, Story $story): JsonResponse
    {
        StoryView::firstOrCreate(['story_id' => $story->id, 'user_id' => $request->user()->id]);

        return ApiResponse::success(null, 'View recorded.');
    }

    public function views(Request $request, Story $story): JsonResponse
    {
        if ($story->user_id !== $request->user()->id) {
            abort(403, 'You can only see viewers of your own stories.');
        }

        $users = User::whereIn('id', $story->views()->select('user_id'))->with('profile')->get();

        return ApiResponse::success(UserSummaryResource::collection($users), 'Story viewers.');
    }
}
