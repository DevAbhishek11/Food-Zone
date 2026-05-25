<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Conversation */
class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $meId = $request->user()?->id;

        /** @var User|null $other */
        $other = $this->whenLoaded('participants', fn () => $this->participants->firstWhere('id', '!=', $meId));

        return [
            'id' => $this->id,
            'other' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'username' => $other->username,
                'avatar' => $other->profile?->avatar,
            ] : null,
            'last_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage ? [
                'body' => $this->latestMessage->body,
                'is_mine' => $this->latestMessage->user_id === $meId,
                'created_at' => $this->latestMessage->created_at?->toIso8601String(),
            ] : null),
            'unread' => (int) ($this->unread_count ?? 0),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
        ];
    }
}
