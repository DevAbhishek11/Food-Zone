<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verifies the Scout index definitions (toSearchableArray + shouldBeSearchable)
 * without requiring a running Meilisearch server. The /search endpoint behaviour
 * on the DB fallback is covered by SearchTest.
 */
class ScoutSearchableTest extends TestCase
{
    use RefreshDatabase;

    public function test_models_expose_searchable_arrays(): void
    {
        $vendor = Vendor::factory()->create(['name' => 'Pizza Palace', 'city' => 'Mumbai']);
        $this->assertEqualsCanonicalizing(
            ['id', 'name', 'description', 'city', 'slug', 'status', 'rating_avg'],
            array_keys($vendor->toSearchableArray()),
        );

        $user = User::factory()->create(['username' => 'chefkito']);
        $this->assertSame('chefkito', $user->toSearchableArray()['username']);

        $post = Post::factory()->create(['body' => 'tasty ramen']);
        $this->assertSame('tasty ramen', $post->toSearchableArray()['body']);
    }

    public function test_only_approved_vendors_are_searchable(): void
    {
        $this->assertTrue(Vendor::factory()->create()->shouldBeSearchable());
        $this->assertFalse(Vendor::factory()->pending()->create()->shouldBeSearchable());
    }

    public function test_only_public_posts_are_searchable(): void
    {
        $this->assertTrue(Post::factory()->create(['privacy' => 'public'])->shouldBeSearchable());
        $this->assertFalse(Post::factory()->private()->create()->shouldBeSearchable());
    }

    public function test_banned_users_are_not_searchable(): void
    {
        $this->assertTrue(User::factory()->create()->shouldBeSearchable());
        $this->assertFalse(User::factory()->create(['status' => 'banned'])->shouldBeSearchable());
    }
}
