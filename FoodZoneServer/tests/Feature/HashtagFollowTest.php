<?php

namespace Tests\Feature;

use App\Models\HashtagFollow;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HashtagFollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_follow_and_unfollow_a_hashtag(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/hashtags/tasty/follow')->assertCreated();
        $this->getJson('/api/v1/hashtags/followed')->assertOk()->assertJsonPath('data.0', 'tasty');

        $this->deleteJson('/api/v1/hashtags/tasty/follow')->assertOk();
        $this->getJson('/api/v1/hashtags/followed')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_follow_is_idempotent_and_normalizes_case_and_hash_prefix(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/hashtags/%23Tasty/follow')->assertCreated();
        $this->postJson('/api/v1/hashtags/tasty/follow')->assertCreated();

        $this->assertEquals(1, HashtagFollow::where('user_id', $me->id)->count());
        $this->assertDatabaseHas('hashtag_follows', ['user_id' => $me->id, 'tag' => 'tasty']);
    }

    public function test_feed_labels_posts_with_a_followed_hashtag(): void
    {
        $me = User::factory()->create();
        HashtagFollow::create(['user_id' => $me->id, 'tag' => 'biryani']);

        $stranger = User::factory()->create();
        $hashtagPost = Post::factory()->create(['user_id' => $stranger->id, 'privacy' => 'public', 'body' => 'best #biryani in town']);
        $plainPost = Post::factory()->create(['user_id' => $stranger->id, 'privacy' => 'public', 'body' => 'just a normal post']);

        Sanctum::actingAs($me);
        $data = $this->getJson('/api/v1/feed')->assertOk()->json('data');

        $byId = collect($data)->keyBy('id');
        $this->assertEquals('hashtag', $byId[$hashtagPost->id]['source']);
        $this->assertEquals('suggested', $byId[$plainPost->id]['source']);
    }

    public function test_followed_posts_take_priority_over_hashtag_label(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        \App\Models\Follow::create(['follower_id' => $me->id, 'following_id' => $friend->id, 'status' => 'accepted']);
        HashtagFollow::create(['user_id' => $me->id, 'tag' => 'biryani']);
        $post = Post::factory()->create(['user_id' => $friend->id, 'privacy' => 'public', 'body' => 'my #biryani recipe']);

        Sanctum::actingAs($me);
        $data = $this->getJson('/api/v1/feed')->assertOk()->json('data');

        $this->assertEquals('following', collect($data)->firstWhere('id', $post->id)['source']);
    }
}
