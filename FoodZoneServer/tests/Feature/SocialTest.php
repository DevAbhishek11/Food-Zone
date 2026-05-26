<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SocialTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_post(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/posts', ['body' => 'Hello FoodZone!'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Hello FoodZone!')
            ->assertJsonPath('data.author.id', $user->id);

        $this->assertEquals(1, $user->profile->fresh()->posts_count);
    }

    public function test_post_requires_body_or_media(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/posts', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('body');
    }

    public function test_user_can_like_and_unlike_a_post(): void
    {
        $author = User::factory()->create();
        $post = Post::factory()->for($author)->create();
        $liker = User::factory()->create();
        Sanctum::actingAs($liker);

        $this->postJson("/api/v1/posts/{$post->id}/like")
            ->assertOk()->assertJsonPath('data.likes_count', 1);

        // Liking again is idempotent.
        $this->postJson("/api/v1/posts/{$post->id}/like")
            ->assertOk()->assertJsonPath('data.likes_count', 1);

        $this->deleteJson("/api/v1/posts/{$post->id}/like")
            ->assertOk()->assertJsonPath('data.likes_count', 0);

        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'type' => 'like']);
    }

    public function test_user_can_comment_on_a_post(): void
    {
        $post = Post::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'Looks delicious!'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Looks delicious!');

        $this->assertEquals(1, $post->fresh()->comments_count);
    }

    public function test_replies_cannot_be_nested_more_than_one_level(): void
    {
        $post = Post::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $comment = $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'top level'])->json('data.id');
        $reply = $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'a reply', 'parent_id' => $comment])
            ->assertCreated()->json('data.id');

        $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'nested', 'parent_id' => $reply])
            ->assertStatus(422);
    }

    public function test_comment_index_returns_replies_nested_under_top_level(): void
    {
        $post = Post::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $comment = $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'top level'])->json('data.id');
        $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'a reply', 'parent_id' => $comment])->assertCreated();

        $this->getJson("/api/v1/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, 'data')                       // only the top-level comment
            ->assertJsonPath('data.0.replies_count', 1)
            ->assertJsonPath('data.0.replies.0.body', 'a reply');
    }

    public function test_deleting_a_parent_comment_removes_its_replies(): void
    {
        $post = Post::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $comment = $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'top level'])->json('data.id');
        $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'reply 1', 'parent_id' => $comment])->assertCreated();
        $this->postJson("/api/v1/posts/{$post->id}/comments", ['body' => 'reply 2', 'parent_id' => $comment])->assertCreated();

        $this->assertEquals(3, $post->fresh()->comments_count);

        $this->deleteJson("/api/v1/comments/{$comment}")->assertOk();

        $this->assertEquals(0, $post->fresh()->comments_count);
        $this->assertDatabaseMissing('post_comments', ['parent_id' => $comment]);
    }

    public function test_user_can_follow_and_unfollow(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/users/{$target->id}/follow")
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        $this->assertTrue($me->fresh()->isFollowing($target->id));
        $this->assertEquals(1, $target->profile->fresh()->followers_count);

        $this->deleteJson("/api/v1/users/{$target->id}/follow")->assertOk();
        $this->assertFalse($me->fresh()->isFollowing($target->id));
    }

    public function test_following_a_private_account_creates_a_pending_request(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->private()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/users/{$target->id}/follow")
            ->assertOk()->assertJsonPath('data.status', 'pending');
    }

    public function test_private_post_is_hidden_from_others(): void
    {
        $author = User::factory()->create();
        $post = Post::factory()->for($author)->private()->create();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/posts/{$post->id}")->assertStatus(403);

        // The author can still see it.
        Sanctum::actingAs($author);
        $this->getJson("/api/v1/posts/{$post->id}")->assertOk();
    }

    public function test_feed_includes_followed_and_own_posts(): void
    {
        $me = User::factory()->create();
        $followed = User::factory()->create();
        $me->following()->create(['following_id' => $followed->id, 'status' => 'accepted']);

        Post::factory()->for($followed)->followersOnly()->create(['body' => 'followers-only post']);
        Post::factory()->for($me)->create(['body' => 'my post']);

        Sanctum::actingAs($me);
        $this->getJson('/api/v1/feed')
            ->assertOk()
            ->assertJsonFragment(['body' => 'followers-only post'])
            ->assertJsonFragment(['body' => 'my post']);
    }

    public function test_profile_show_reports_relationship_flags(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $me->following()->create(['following_id' => $target->id, 'status' => 'accepted']);

        Sanctum::actingAs($me);
        $this->getJson("/api/v1/users/{$target->username}")
            ->assertOk()
            ->assertJsonPath('data.username', $target->username)
            ->assertJsonPath('data.is_following', true)
            ->assertJsonPath('data.is_blocked', false);
    }

    public function test_user_posts_endpoint_respects_privacy(): void
    {
        $author = User::factory()->create();
        Post::factory()->for($author)->create(['body' => 'public one']);
        Post::factory()->for($author)->followersOnly()->create(['body' => 'followers one']);
        Post::factory()->for($author)->private()->create(['body' => 'private one']);

        // A stranger sees only the public post.
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);
        $this->getJson("/api/v1/users/{$author->username}/posts")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['body' => 'public one']);

        // A follower also sees the followers-only post.
        $follower = User::factory()->create();
        $follower->following()->create(['following_id' => $author->id, 'status' => 'accepted']);
        Sanctum::actingAs($follower);
        $this->getJson("/api/v1/users/{$author->username}/posts")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // The author sees all three.
        Sanctum::actingAs($author);
        $this->getJson("/api/v1/users/{$author->username}/posts")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_blocking_removes_follow_relationship(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $me->following()->create(['following_id' => $other->id, 'status' => 'accepted']);

        Sanctum::actingAs($me);
        $this->postJson("/api/v1/users/{$other->id}/block")->assertOk();

        $this->assertFalse($me->fresh()->isFollowing($other->id));
        $this->assertTrue($me->fresh()->hasBlocked($other->id));
    }
}
