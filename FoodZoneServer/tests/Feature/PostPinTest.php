<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostPinTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_pin_and_unpin_a_post(): void
    {
        $me = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->putJson("/api/v1/posts/{$post->id}/pin")
            ->assertOk()
            ->assertJsonPath('data.is_pinned', true);

        $this->putJson("/api/v1/posts/{$post->id}/pin")
            ->assertOk()
            ->assertJsonPath('data.is_pinned', false);
    }

    public function test_pinning_is_capped_at_three_posts(): void
    {
        $me = User::factory()->create();
        Post::factory(3)->create(['user_id' => $me->id, 'is_pinned' => true]);
        $fourth = Post::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->putJson("/api/v1/posts/{$fourth->id}/pin")->assertStatus(422);
    }

    public function test_cannot_pin_someone_elses_post(): void
    {
        $post = Post::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/v1/posts/{$post->id}/pin")->assertStatus(403);
    }

    public function test_pinned_posts_come_first_on_profile(): void
    {
        $me = User::factory()->create();
        $old = Post::factory()->create(['user_id' => $me->id, 'created_at' => now()->subDays(5)]);
        Post::factory()->create(['user_id' => $me->id, 'created_at' => now()]);
        $old->update(['is_pinned' => true]);

        Sanctum::actingAs($me);
        $this->getJson("/api/v1/users/{$me->username}/posts")
            ->assertOk()
            ->assertJsonPath('data.0.id', $old->id)
            ->assertJsonPath('data.0.is_pinned', true);
    }
}
