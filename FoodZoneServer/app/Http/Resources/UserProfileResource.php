<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\UserProfile */
class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'bio' => $this->bio,
            'avatar' => $this->avatar,
            'cover' => $this->cover,
            'website' => $this->website,
            'location' => $this->location,
            'is_private' => (bool) $this->is_private,
            'food_preferences' => $this->food_preferences ?? [],
            'dietary_restrictions' => $this->dietary_restrictions ?? [],
            'followers_count' => (int) $this->followers_count,
            'following_count' => (int) $this->following_count,
            'posts_count' => (int) $this->posts_count,
        ];
    }
}
