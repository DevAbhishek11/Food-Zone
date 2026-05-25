<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_starting_a_conversation_is_idempotent(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($me);

        $first = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])->assertCreated()->json('data.id');
        $second = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])->assertCreated()->json('data.id');

        $this->assertEquals($first, $second);
        $this->assertEquals(1, Conversation::count());
    }

    public function test_cannot_message_yourself(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);
        $this->postJson('/api/v1/conversations', ['user_id' => $me->id])->assertStatus(422);
    }

    public function test_participants_can_send_and_read_messages_and_it_broadcasts(): void
    {
        Event::fake([MessageSent::class]);
        $me = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($me);

        $convId = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])->json('data.id');

        $this->postJson("/api/v1/conversations/{$convId}/messages", ['body' => 'Hey there!'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Hey there!')
            ->assertJsonPath('data.is_mine', true);

        Event::assertDispatched(MessageSent::class);
        $this->assertDatabaseHas('notifications', ['user_id' => $other->id, 'type' => 'message']);

        $this->getJson("/api/v1/conversations/{$convId}/messages")->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_non_participant_cannot_access_conversation(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        Sanctum::actingAs($a);
        $convId = $this->postJson('/api/v1/conversations', ['user_id' => $b->id])->json('data.id');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/conversations/{$convId}/messages")->assertStatus(403);
        $this->postJson("/api/v1/conversations/{$convId}/messages", ['body' => 'hi'])->assertStatus(403);
    }

    public function test_conversation_list_shows_unread_and_last_message(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        // other starts the conversation and messages me — unread for me.
        Sanctum::actingAs($other);
        $convId = $this->postJson('/api/v1/conversations', ['user_id' => $me->id])->json('data.id');
        $this->postJson("/api/v1/conversations/{$convId}/messages", ['body' => 'first message'])->assertCreated();

        Sanctum::actingAs($me);
        $this->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.unread', 1)
            ->assertJsonPath('data.0.last_message.body', 'first message');

        $this->getJson('/api/v1/conversations/unread-count')->assertOk()->assertJsonPath('data.unread', 1);

        $this->postJson("/api/v1/conversations/{$convId}/read")->assertOk();
        $this->getJson('/api/v1/conversations/unread-count')->assertOk()->assertJsonPath('data.unread', 0);
    }
}
