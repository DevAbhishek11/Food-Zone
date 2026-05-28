<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Message */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $meId = $request->user()?->id;
        $deleted = $this->trashed();

        // Group reactions by emoji → { emoji, count, mine }.
        $reactions = null;
        if ($this->relationLoaded('reactions')) {
            $reactions = $this->reactions->groupBy('emoji')->map(fn ($group, $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'mine' => $meId ? $group->contains('user_id', $meId) : false,
            ])->values();
        }

        // A small snippet of the replied-to message (when present + loaded).
        $repliedTo = null;
        if ($this->replied_to_message_id && $this->relationLoaded('repliedTo') && $this->repliedTo) {
            $repliedTo = [
                'id' => $this->repliedTo->id,
                'body' => $this->repliedTo->body,
                'sender_id' => $this->repliedTo->user_id,
            ];
        }

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'body' => $deleted ? null : $this->body,
            'type' => $this->type ?? 'text',
            'media_url' => $deleted ? null : $this->media_url,
            'is_mine' => $meId === $this->user_id,
            'is_deleted' => $deleted,
            'replied_to_message_id' => $this->replied_to_message_id,
            'replied_to' => $repliedTo,
            'reactions' => $reactions,
            'is_starred' => (bool) ($this->is_starred ?? false),
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'username' => $this->sender->username,
                'avatar' => $this->sender->profile?->avatar,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
