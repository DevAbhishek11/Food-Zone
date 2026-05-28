<?php

namespace Tests\Feature;

use App\Events\UserTyping;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatV2Test extends TestCase
{
    use RefreshDatabase;

    /** Helper: start a conversation between $a and $b and return its id. */
    private function startConv(User $a, User $b): int
    {
        Sanctum::actingAs($a);

        return $this->postJson('/api/v1/conversations', ['user_id' => $b->id])
            ->assertCreated()
            ->json('data.id');
    }

    public function test_pin_toggles_and_pinned_conversations_come_first(): void
    {
        $me = User::factory()->create();
        $a = User::factory()->create();
        $b = User::factory()->create();

        $conv1 = $this->startConv($me, $a);
        $conv2 = $this->startConv($me, $b);

        // Pin conv1 (older) — it should now appear before conv2 even though conv2 is newer.
        $this->putJson("/api/v1/conversations/{$conv1}/pin")->assertOk()->assertJsonPath('data.is_pinned', true);

        $ids = collect($this->getJson('/api/v1/conversations')->json('data'))->pluck('id');
        $this->assertEquals($conv1, $ids->first());

        // Unpin
        $this->putJson("/api/v1/conversations/{$conv1}/pin")->assertOk()->assertJsonPath('data.is_pinned', false);
    }

    public function test_mute_sets_until_and_unmute_clears(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);

        $this->putJson("/api/v1/conversations/{$conv}/mute", ['muted' => true, 'minutes' => 60])
            ->assertOk()
            ->assertJsonPath('data.is_muted', true);

        $this->putJson("/api/v1/conversations/{$conv}/mute", ['muted' => false])->assertOk();
    }

    public function test_typing_broadcasts(): void
    {
        Event::fake([UserTyping::class]);
        $me = User::factory()->create();
        $conv = $this->startConv($me, User::factory()->create());

        $this->postJson("/api/v1/conversations/{$conv}/typing")->assertOk();
        Event::assertDispatched(UserTyping::class);
    }

    public function test_reactions_can_be_added_and_removed(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);
        $msgId = $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'hi'])->json('data.id');

        Sanctum::actingAs($other);
        $this->postJson("/api/v1/messages/{$msgId}/react", ['emoji' => '❤️'])
            ->assertOk()->assertJsonPath('data.action', 'added');

        $this->getJson("/api/v1/conversations/{$conv}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.reactions.0.emoji', '❤️')
            ->assertJsonPath('data.0.reactions.0.count', 1);

        // Toggling the same emoji removes it.
        $this->postJson("/api/v1/messages/{$msgId}/react", ['emoji' => '❤️'])
            ->assertOk()->assertJsonPath('data.action', 'removed');
    }

    public function test_reply_links_to_parent_message(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);
        $parentId = $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'parent'])->json('data.id');

        $this->postJson("/api/v1/conversations/{$conv}/messages", [
            'body' => 'a reply',
            'replied_to_message_id' => $parentId,
        ])->assertCreated()->assertJsonPath('data.replied_to_message_id', $parentId);
    }

    public function test_sender_can_soft_delete_message_and_body_hides(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);
        $msgId = $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'secret'])->json('data.id');

        $this->deleteJson("/api/v1/messages/{$msgId}")->assertOk();

        // The message stays in the thread but body is hidden and is_deleted=true.
        $res = $this->getJson("/api/v1/conversations/{$conv}/messages")->assertOk();
        $deleted = collect($res->json('data'))->firstWhere('id', $msgId);
        $this->assertTrue($deleted['is_deleted']);
        $this->assertNull($deleted['body']);

        // Another user cannot delete it (non-sender).
        $msgId2 = $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'mine too'])->json('data.id');
        Sanctum::actingAs($other);
        $this->deleteJson("/api/v1/messages/{$msgId2}")->assertStatus(403);
    }

    public function test_star_unstar_and_list(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);
        $m1 = $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'keep this'])->json('data.id');
        $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'forget this'])->json('data.id');

        $this->postJson("/api/v1/messages/{$m1}/star")->assertCreated();
        $this->getJson("/api/v1/conversations/{$conv}/starred")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $m1)
            ->assertJsonPath('data.0.is_starred', true);

        $this->deleteJson("/api/v1/messages/{$m1}/star")->assertOk();
        $this->getJson("/api/v1/conversations/{$conv}/starred")->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_in_conversation_search(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $conv = $this->startConv($me, $other);
        $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'pizza tonight?'])->assertCreated();
        $this->postJson("/api/v1/conversations/{$conv}/messages", ['body' => 'unrelated'])->assertCreated();

        $this->getJson("/api/v1/conversations/{$conv}/search?q=pizza")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'pizza tonight?');
    }

    public function test_forward_creates_a_copy_in_the_target_conversation(): void
    {
        $me = User::factory()->create();
        $a = User::factory()->create();
        $b = User::factory()->create();
        $convA = $this->startConv($me, $a);
        $convB = $this->startConv($me, $b);

        $srcId = $this->postJson("/api/v1/conversations/{$convA}/messages", ['body' => 'forward me'])->json('data.id');
        $this->postJson("/api/v1/conversations/{$convB}/forward", ['message_id' => $srcId])
            ->assertCreated()
            ->assertJsonPath('data.body', 'forward me')
            ->assertJsonPath('data.conversation_id', $convB);
    }
}
