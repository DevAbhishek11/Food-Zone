<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Post */
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userId = $request->user()?->id;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'type' => $this->type,
            'privacy' => $this->privacy?->value,
            'location' => $this->location,
            'is_pinned' => (bool) $this->is_pinned,
            'author' => new UserSummaryResource($this->whenLoaded('user')),
            'media' => PostMediaResource::collection($this->whenLoaded('media')),
            'likes_count' => (int) $this->likes_count,
            'comments_count' => (int) $this->comments_count,
            'shares_count' => (int) $this->shares_count,
            'liked_by_me' => $userId
                ? ($this->relationLoaded('likes')
                    ? $this->likes->contains('user_id', $userId)
                    : $this->isLikedBy($userId))
                : false,
            'tagged_vendor_id' => $this->tagged_vendor_id,
            'tagged_item_id' => $this->tagged_item_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
