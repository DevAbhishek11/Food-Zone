<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Story;
use App\Models\StoryHighlight;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_show_returns_extended_payload(): void
    {
        $user = User::factory()->create(['is_verified' => true]);
        UserProfile::updateOrCreate(['user_id' => $user->id], ['location' => 'Mumbai']);
        Post::factory()->for($user)->create(['body' => 'Loving the #pizza vibes #foodie']);
        Post::factory()->for($user)->create(['body' => 'More #pizza tonight!']);

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertOk()
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.profile.location', 'Mumbai')
            ->assertJsonPath('data.top_food_tags.0', 'pizza')
            ->assertJsonStructure(['data' => ['member_since', 'mutual_followers', 'top_food_tags']]);
    }

    public function test_mutual_followers_appears_for_viewer(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $mutual = User::factory()->create();

        Sanctum::actingAs($me);
        $this->postJson("/api/v1/users/{$mutual->id}/follow")->assertOk();
        Sanctum::actingAs($mutual);
        $this->postJson("/api/v1/users/{$target->id}/follow")->assertOk();

        Sanctum::actingAs($me);
        $this->getJson("/api/v1/users/{$target->username}")
            ->assertOk()
            ->assertJsonPath('data.mutual_followers.0.id', $mutual->id);
    }

    public function test_profile_update_accepts_location(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->putJson('/api/v1/profile', ['location' => 'Bengaluru', 'website' => 'https://example.com'])
            ->assertOk()
            ->assertJsonPath('data.profile.location', 'Bengaluru')
            ->assertJsonPath('data.profile.website', 'https://example.com');
    }

    public function test_food_journey_returns_only_tagged_posts(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create();
        Post::factory()->for($user)->create(['body' => 'plain']); // no tag
        $tagged = Post::factory()->for($user)->create(['tagged_vendor_id' => $vendor->id]);

        $this->getJson("/api/v1/users/{$user->username}/food-journey")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $tagged->id);
    }

    public function test_tagged_in_returns_posts_mentioning_username(): void
    {
        $target = User::factory()->create(['username' => 'alice']);
        $author = User::factory()->create();
        $mention = Post::factory()->for($author)->create(['body' => 'Dinner with @alice last night']);
        Post::factory()->for($author)->create(['body' => 'no mention']);

        $this->getJson("/api/v1/users/{$target->username}/tagged-in")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mention->id);
    }

    public function test_user_can_create_a_story_highlight_from_own_stories(): void
    {
        $me = User::factory()->create();
        $s1 = Story::create(['user_id' => $me->id, 'media_url' => 'a.jpg', 'expires_at' => now()->addDay()]);
        $s2 = Story::create(['user_id' => $me->id, 'media_url' => 'b.jpg', 'expires_at' => now()->addDay()]);
        Sanctum::actingAs($me);

        $id = $this->postJson('/api/v1/story-highlights', [
            'name' => 'Best of',
            'cover_url' => 'cover.jpg',
            'story_ids' => [$s1->id, $s2->id],
        ])->assertCreated()->json('data.id');

        $this->getJson("/api/v1/users/{$me->username}/highlights")
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Best of');

        // Delete own highlight
        $this->deleteJson("/api/v1/story-highlights/{$id}")->assertOk();
        $this->assertDatabaseMissing('story_highlights', ['id' => $id]);
    }

    public function test_cannot_highlight_another_users_stories(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $otherStory = Story::create(['user_id' => $other->id, 'media_url' => 'x.jpg', 'expires_at' => now()->addDay()]);
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/story-highlights', ['name' => 'Stolen', 'story_ids' => [$otherStory->id]])
            ->assertStatus(422);
    }

    public function test_non_owner_cannot_delete_a_highlight(): void
    {
        $owner = User::factory()->create();
        $highlight = StoryHighlight::create(['user_id' => $owner->id, 'name' => 'Mine', 'story_ids' => [1]]);
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/v1/story-highlights/{$highlight->id}")->assertStatus(403);
    }
}
