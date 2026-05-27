<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostPrivacy;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HashtagController extends Controller
{
    /** Top hashtags extracted from recent public post bodies. */
    public function trending(): JsonResponse
    {
        $bodies = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('created_at', '>=', now()->subDay())
            ->whereNotNull('body')
            ->latest()
            ->limit(500)
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
        $top = array_slice($counts, 0, 10, true);

        $data = [];
        foreach ($top as $tag => $count) {
            $data[] = ['tag' => $tag, 'count' => $count];
        }

        return ApiResponse::success($data, 'Trending hashtags.');
    }

    /** Public posts containing a given hashtag. */
    public function posts(Request $request, string $tag): JsonResponse
    {
        $me = $request->user();
        $tag = ltrim($tag, '#');

        $posts = Post::query()
            ->where('privacy', PostPrivacy::Public->value)
            ->where('body', 'like', '%#'.$tag.'%')
            ->with(['user.profile', 'media'])
            ->when($me, fn ($q) => $q
                ->with(['likes' => fn ($l) => $l->where('user_id', $me->id)])
                ->withExists(['savedBy as is_saved' => fn ($s) => $s->where('user_id', $me->id)]))
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($posts, PostResource::class, "Posts tagged #{$tag}.");
    }
}
