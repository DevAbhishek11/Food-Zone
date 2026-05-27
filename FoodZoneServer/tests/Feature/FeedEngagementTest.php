<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FeedEngagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_and_unsave_a_post(): void
    {
        $post = Post::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/posts/{$post->id}/save")->assertCreated();
        $this->assertDatabaseHas('saved_posts', ['user_id' => $me->id, 'post_id' => $post->id]);

        // Reflected in the feed flag.
        $this->getJson('/api/v1/feed')->assertOk()->assertJsonPath('data.0.is_saved', true);

        $this->deleteJson("/api/v1/posts/{$post->id}/save")->assertOk();
        $this->assertDatabaseMissing('saved_posts', ['user_id' => $me->id, 'post_id' => $post->id]);
    }

    public function test_saved_endpoint_lists_saved_posts(): void
    {
        $a = Post::factory()->create();
        Post::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/posts/{$a->id}/save")->assertCreated();

        $this->getJson('/api/v1/saved')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $a->id);
    }

    public function test_sharing_increments_count_and_is_idempotent(): void
    {
        $post = Post::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/posts/{$post->id}/share")->assertOk()->assertJsonPath('data.shares_count', 1);
        $this->postJson("/api/v1/posts/{$post->id}/share")->assertOk()->assertJsonPath('data.shares_count', 1);

        $this->assertEquals(1, $post->fresh()->shares_count);
    }

    public function test_shares_and_liked_by_list_users(): void
    {
        $post = Post::factory()->create();
        $sharer = User::factory()->create();
        Sanctum::actingAs($sharer);
        $this->postJson("/api/v1/posts/{$post->id}/share")->assertOk();
        $this->postJson("/api/v1/posts/{$post->id}/like")->assertOk();

        $this->getJson("/api/v1/posts/{$post->id}/shares")->assertOk()->assertJsonPath('data.0.id', $sharer->id);
        $this->getJson("/api/v1/posts/{$post->id}/liked-by")->assertOk()->assertJsonPath('data.0.id', $sharer->id);
    }

    public function test_trending_orders_by_engagement(): void
    {
        $low = Post::factory()->create();
        $high = Post::factory()->create();
        $high->forceFill(['likes_count' => 50, 'shares_count' => 5])->save();
        $low->forceFill(['likes_count' => 1])->save();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/posts/trending?hours=24')
            ->assertOk()
            ->assertJsonPath('data.0.id', $high->id);
    }

    public function test_trending_excludes_posts_outside_the_window(): void
    {
        $old = Post::factory()->create();
        $old->forceFill(['created_at' => now()->subDays(3)])->save();
        Sanctum::actingAs(User::factory()->create());

        $ids = collect($this->getJson('/api/v1/posts/trending?hours=6')->json('data'))->pluck('id');
        $this->assertNotContains($old->id, $ids);
    }

    public function test_hashtag_trending_and_feed(): void
    {
        Post::factory()->create(['body' => 'Best #pizza in town! #foodie']);
        Post::factory()->create(['body' => 'Another #pizza night']);
        Sanctum::actingAs(User::factory()->create());

        $tags = collect($this->getJson('/api/v1/hashtags/trending')->assertOk()->json('data'))->pluck('tag');
        $this->assertContains('pizza', $tags);

        $this->getJson('/api/v1/hashtags/pizza/posts')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_suggested_excludes_followed_and_self(): void
    {
        $me = User::factory()->create();
        $followed = User::factory()->create();
        $stranger = User::factory()->create();

        Sanctum::actingAs($me);
        $this->postJson("/api/v1/users/{$followed->id}/follow")->assertOk();

        $mine = Post::factory()->for($me)->create();
        $followedPost = Post::factory()->for($followed)->create();
        $strangerPost = Post::factory()->for($stranger)->create();

        $ids = collect($this->getJson('/api/v1/feed/suggested')->assertOk()->json('data'))->pluck('id');

        $this->assertContains($strangerPost->id, $ids);
        $this->assertNotContains($mine->id, $ids);
        $this->assertNotContains($followedPost->id, $ids);
    }
}
