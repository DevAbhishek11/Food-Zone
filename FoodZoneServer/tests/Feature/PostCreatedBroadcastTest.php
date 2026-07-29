<?php

namespace Tests\Feature;

use App\Events\PostCreated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostCreatedBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_public_post_broadcasts_post_created(): void
    {
        Event::fake([PostCreated::class]);
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $res = $this->postJson('/api/v1/posts', ['body' => 'hello world', 'privacy' => 'public'])->assertCreated();

        Event::assertDispatched(PostCreated::class, fn ($e) => $e->postId === $res->json('data.id') && $e->authorId === $me->id);
    }

    public function test_creating_a_private_post_does_not_broadcast(): void
    {
        Event::fake([PostCreated::class]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/posts', ['body' => 'just for me', 'privacy' => 'private'])->assertCreated();

        Event::assertNotDispatched(PostCreated::class);
    }

    public function test_creating_a_followers_only_post_does_not_broadcast(): void
    {
        Event::fake([PostCreated::class]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/posts', ['body' => 'friends only', 'privacy' => 'followers'])->assertCreated();

        Event::assertNotDispatched(PostCreated::class);
    }

    public function test_post_created_event_broadcasts_on_the_public_feed_channel(): void
    {
        $event = new PostCreated(42, 7);

        $this->assertSame('feed', $event->broadcastOn()->name);
        $this->assertSame('post.created', $event->broadcastAs());
        $this->assertSame(['post_id' => 42, 'author_id' => 7], $event->broadcastWith());
    }
}
