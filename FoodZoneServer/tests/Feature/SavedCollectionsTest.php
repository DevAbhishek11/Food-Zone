<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\SavedCollection;
use App\Models\SavedPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SavedCollectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_list_collections(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/collections', ['name' => 'Recipes'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Recipes')
            ->assertJsonPath('data.posts_count', 0);

        $this->getJson('/api/v1/collections')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Recipes');
    }

    public function test_collection_names_are_unique_per_user(): void
    {
        $me = User::factory()->create();
        SavedCollection::create(['user_id' => $me->id, 'name' => 'Date night']);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/collections', ['name' => 'Date night'])->assertStatus(422);
    }

    public function test_different_users_can_reuse_the_same_collection_name(): void
    {
        SavedCollection::create(['user_id' => User::factory()->create()->id, 'name' => 'Recipes']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/collections', ['name' => 'Recipes'])->assertCreated();
    }

    public function test_saving_a_post_into_a_collection_and_filtering_by_it(): void
    {
        $me = User::factory()->create();
        $collection = SavedCollection::create(['user_id' => $me->id, 'name' => 'Recipes']);
        $postInCollection = Post::factory()->create();
        $postUncategorized = Post::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/posts/{$postInCollection->id}/save", ['collection_id' => $collection->id])
            ->assertCreated();
        $this->postJson("/api/v1/posts/{$postUncategorized->id}/save")->assertCreated();

        $filtered = $this->getJson("/api/v1/saved?collection_id={$collection->id}")->assertOk()->json('data');
        $this->assertCount(1, $filtered);
        $this->assertEquals($postInCollection->id, $filtered[0]['id']);

        $all = $this->getJson('/api/v1/saved')->assertOk()->json('data');
        $this->assertCount(2, $all);
    }

    public function test_resaving_a_post_moves_it_between_collections(): void
    {
        $me = User::factory()->create();
        $a = SavedCollection::create(['user_id' => $me->id, 'name' => 'A']);
        $b = SavedCollection::create(['user_id' => $me->id, 'name' => 'B']);
        $post = Post::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/v1/posts/{$post->id}/save", ['collection_id' => $a->id])->assertCreated();
        $this->postJson("/api/v1/posts/{$post->id}/save", ['collection_id' => $b->id])->assertCreated();

        $this->assertEquals(1, SavedPost::where('user_id', $me->id)->where('post_id', $post->id)->count());
        $this->assertEquals($b->id, SavedPost::where('user_id', $me->id)->where('post_id', $post->id)->first()->collection_id);
    }

    public function test_deleting_a_collection_uncategorizes_its_posts_instead_of_deleting_them(): void
    {
        $me = User::factory()->create();
        $collection = SavedCollection::create(['user_id' => $me->id, 'name' => 'Recipes']);
        $post = Post::factory()->create();
        SavedPost::create(['user_id' => $me->id, 'post_id' => $post->id, 'collection_id' => $collection->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/v1/collections/{$collection->id}")->assertOk();

        $this->assertDatabaseHas('saved_posts', ['user_id' => $me->id, 'post_id' => $post->id, 'collection_id' => null]);
    }

    public function test_cannot_save_into_someone_elses_collection(): void
    {
        $collection = SavedCollection::create(['user_id' => User::factory()->create()->id, 'name' => 'Recipes']);
        $post = Post::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/posts/{$post->id}/save", ['collection_id' => $collection->id])->assertStatus(422);
    }

    public function test_cannot_delete_someone_elses_collection(): void
    {
        $collection = SavedCollection::create(['user_id' => User::factory()->create()->id, 'name' => 'Recipes']);
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/v1/collections/{$collection->id}")->assertStatus(403);
    }
}
