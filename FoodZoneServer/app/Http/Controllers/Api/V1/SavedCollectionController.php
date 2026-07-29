<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SavedCollection;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Named folders for organising bookmarked posts (spec §9.4). */
class SavedCollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collections = SavedCollection::where('user_id', $request->user()->id)
            ->withCount('savedPosts')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'posts_count' => $c->saved_posts_count,
                'created_at' => $c->created_at,
            ]);

        return ApiResponse::success($collections, 'Collections loaded.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:60',
                Rule::unique('saved_collections')->where('user_id', $request->user()->id),
            ],
        ]);

        $collection = SavedCollection::create(['user_id' => $request->user()->id, 'name' => $data['name']]);

        return ApiResponse::success(['id' => $collection->id, 'name' => $collection->name, 'posts_count' => 0], 'Collection created.', 201);
    }

    public function destroy(Request $request, SavedCollection $collection): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own collections.');
        }

        // Posts inside fall back to the default "Saved" bucket, not deleted.
        $collection->delete();

        return ApiResponse::success(null, 'Collection deleted.');
    }
}
