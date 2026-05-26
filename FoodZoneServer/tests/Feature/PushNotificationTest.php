<?php

namespace Tests\Feature;

use App\Jobs\SendPushNotification;
use App\Models\PushToken;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_a_push_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/push-tokens', ['token' => 'ExponentPushToken[abc]', 'platform' => 'android'])
            ->assertCreated();

        $this->assertDatabaseHas('push_tokens', [
            'token' => 'ExponentPushToken[abc]',
            'user_id' => $user->id,
            'platform' => 'android',
        ]);
    }

    public function test_registering_an_existing_token_reassigns_it(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        PushToken::create(['user_id' => $a->id, 'token' => 'ExponentPushToken[shared]', 'platform' => 'ios']);

        Sanctum::actingAs($b);
        $this->postJson('/api/v1/push-tokens', ['token' => 'ExponentPushToken[shared]'])->assertCreated();

        $this->assertEquals(1, PushToken::where('token', 'ExponentPushToken[shared]')->count());
        $this->assertEquals($b->id, PushToken::where('token', 'ExponentPushToken[shared]')->first()->user_id);
    }

    public function test_user_can_unregister_their_token(): void
    {
        $user = User::factory()->create();
        PushToken::create(['user_id' => $user->id, 'token' => 'ExponentPushToken[gone]']);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/v1/push-tokens', ['token' => 'ExponentPushToken[gone]'])->assertOk();
        $this->assertDatabaseMissing('push_tokens', ['token' => 'ExponentPushToken[gone]']);
    }

    public function test_notify_dispatches_a_push_job_when_enabled(): void
    {
        Queue::fake();
        config(['push.enabled' => true]);

        $user = User::factory()->create();
        app(NotificationService::class)->notify($user->id, 'test', 'Hello', 'World');

        Queue::assertPushed(SendPushNotification::class, fn ($job) => $job->userId === $user->id && $job->title === 'Hello');
    }

    public function test_notify_does_not_dispatch_push_when_disabled(): void
    {
        Queue::fake();
        config(['push.enabled' => false]);

        $user = User::factory()->create();
        app(NotificationService::class)->notify($user->id, 'test', 'Hello', 'World');

        Queue::assertNotPushed(SendPushNotification::class);
    }
}
