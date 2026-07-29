<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A new public post was created. Broadcast on a public channel (no per-user
 * auth needed) so any open feed can show a "N new posts" banner — the feed
 * itself already surfaces all public posts regardless of follow graph, so
 * this is purely a live-refresh signal, not new access.
 */
class PostCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $postId, public int $authorId) {}

    public function broadcastOn(): Channel
    {
        return new Channel('feed');
    }

    public function broadcastAs(): string
    {
        return 'post.created';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return ['post_id' => $this->postId, 'author_id' => $this->authorId];
    }
}
