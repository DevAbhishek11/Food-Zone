<?php

namespace Tests\Feature;

use App\Models\Story;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_post_a_story(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/stories', ['media_url' => 'https://cdn/x.jpg', 'caption' => 'lunch'])
            ->assertCreated()
            ->assertJsonPath('data.caption', 'lunch');

        $this->assertDatabaseHas('stories', ['user_id' => $me->id, 'media_url' => 'https://cdn/x.jpg']);
    }

    public function test_index_groups_active_stories_and_excludes_expired(): void
    {
        $me = User::factory()->create();
        Story::create(['user_id' => $me->id, 'media_url' => 'a.jpg', 'expires_at' => now()->addHours(5)]);
        Story::create(['user_id' => $me->id, 'media_url' => 'b.jpg', 'expires_at' => now()->subHour()]); // expired

        Sanctum::actingAs($me);
        $res = $this->getJson('/api/v1/stories')->assertOk();

        $res->assertJsonCount(1, 'data');                 // one group (me)
        $res->assertJsonCount(1, 'data.0.stories');       // only the active story
        $res->assertJsonPath('data.0.is_mine', true);
    }

    public function test_recording_a_view_and_owner_sees_viewers(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $story = Story::create(['user_id' => $owner->id, 'media_url' => 'a.jpg', 'expires_at' => now()->addHours(5)]);

        Sanctum::actingAs($viewer);
        $this->postJson("/api/v1/stories/{$story->id}/view")->assertOk();
        $this->assertDatabaseHas('story_views', ['story_id' => $story->id, 'user_id' => $viewer->id]);

        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/stories/{$story->id}/views")->assertOk()->assertJsonPath('data.0.id', $viewer->id);
    }

    public function test_non_owner_cannot_see_viewers_or_delete(): void
    {
        $owner = User::factory()->create();
        $story = Story::create(['user_id' => $owner->id, 'media_url' => 'a.jpg', 'expires_at' => now()->addHours(5)]);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/stories/{$story->id}/views")->assertStatus(403);
        $this->deleteJson("/api/v1/stories/{$story->id}")->assertStatus(403);
    }

    public function test_owner_can_delete_their_story(): void
    {
        $owner = User::factory()->create();
        $story = Story::create(['user_id' => $owner->id, 'media_url' => 'a.jpg', 'expires_at' => now()->addHours(5)]);

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/stories/{$story->id}")->assertOk();
        $this->assertDatabaseMissing('stories', ['id' => $story->id]);
    }
}
