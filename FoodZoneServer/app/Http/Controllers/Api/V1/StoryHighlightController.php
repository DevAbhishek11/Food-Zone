<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StoryHighlight;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryHighlightController extends Controller
{
    /** A user's saved story highlights (publicly visible). */
    public function index(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        $highlights = StoryHighlight::where('user_id', $user->id)
            ->latest()
            ->get(['id', 'name', 'cover_url', 'story_ids', 'created_at']);

        return ApiResponse::success($highlights, 'Highlights loaded.');
    }

    /** Create a highlight from a set of own story ids. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'cover_url' => ['nullable', 'string', 'max:2048'],
            'story_ids' => ['required', 'array', 'min:1'],
            'story_ids.*' => ['integer'],
        ]);

        // Only own stories may be highlighted.
        $owned = $request->user()->stories()->whereIn('id', $data['story_ids'])->pluck('id')->all();
        if (count($owned) !== count($data['story_ids'])) {
            return ApiResponse::error('You can only highlight your own stories.', 422);
        }

        $highlight = $request->user()->highlights()->create([
            'name' => $data['name'],
            'cover_url' => $data['cover_url'] ?? null,
            'story_ids' => $owned,
        ]);

        return ApiResponse::success($highlight, 'Highlight created.', 201);
    }

    public function destroy(Request $request, StoryHighlight $highlight): JsonResponse
    {
        if ($highlight->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own highlights.');
        }
        $highlight->delete();

        return ApiResponse::success(null, 'Highlight deleted.');
    }
}
