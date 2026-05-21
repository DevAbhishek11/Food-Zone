<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_liking_a_post_notifies_the_author_with_actor_data(): void
    {
        $author = User::factory()->create();
        $post = Post::factory()->for($author)->create();
        $liker = User::factory()->create();

        Sanctum::actingAs($liker);
        $this->postJson("/api/v1/posts/{$post->id}/like")->assertOk();

        $notification = Notification::where('user_id', $author->id)->where('type', 'like')->first();
        $this->assertNotNull($notification);
        $this->assertEquals($liker->id, $notification->data['actor']['id']);
        $this->assertEquals($liker->username, $notification->data['actor']['username']);
        $this->assertEquals($post->id, $notification->data['post_id']);
    }

    public function test_user_can_list_their_notifications(): void
    {
        $user = User::factory()->create();
        Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'Hello']);
        // A notification for someone else must not leak in.
        Notification::create(['user_id' => User::factory()->create()->id, 'type' => 'system', 'title' => 'Other']);

        Sanctum::actingAs($user);
        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Hello')
            ->assertJsonPath('data.0.is_read', false);
    }

    public function test_unread_count_reflects_unread_notifications(): void
    {
        $user = User::factory()->create();
        Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'A']);
        Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'B', 'read_at' => now()]);

        Sanctum::actingAs($user);
        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread', 1);
    }

    public function test_user_can_mark_one_and_all_as_read(): void
    {
        $user = User::factory()->create();
        $n1 = Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'A']);
        Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'B']);

        Sanctum::actingAs($user);
        $this->postJson("/api/v1/notifications/{$n1->id}/read")->assertOk();
        $this->assertNotNull($n1->fresh()->read_at);

        $this->postJson('/api/v1/notifications/read-all')->assertOk();
        $this->assertEquals(0, $user->notifications()->whereNull('read_at')->count());
    }

    public function test_user_cannot_touch_another_users_notification(): void
    {
        $owner = User::factory()->create();
        $notification = Notification::create(['user_id' => $owner->id, 'type' => 'system', 'title' => 'Private']);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/v1/notifications/{$notification->id}/read")->assertStatus(403);
        $this->deleteJson("/api/v1/notifications/{$notification->id}")->assertStatus(403);
    }

    public function test_user_can_delete_one_and_clear_all(): void
    {
        $user = User::factory()->create();
        $n1 = Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'A']);
        Notification::create(['user_id' => $user->id, 'type' => 'system', 'title' => 'B']);

        Sanctum::actingAs($user);
        $this->deleteJson("/api/v1/notifications/{$n1->id}")->assertOk();
        $this->assertDatabaseMissing('notifications', ['id' => $n1->id]);

        $this->deleteJson('/api/v1/notifications')->assertOk();
        $this->assertEquals(0, $user->notifications()->count());
    }
}
