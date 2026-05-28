<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Emitted (no DB) when a participant types in a conversation. The clients
 * subscribe on the conversation channel and show a short-lived "typing…"
 * indicator (TTL is enforced client-side, typically 3s).
 */
class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $userId,
        public string $username,
    ) {}

    /** @return Channel[] */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("conversation.{$this->conversationId}")];
    }

    public function broadcastAs(): string
    {
        return 'user.typing';
    }

    /** @return array<string,mixed> */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'username' => $this->username,
        ];
    }
}
