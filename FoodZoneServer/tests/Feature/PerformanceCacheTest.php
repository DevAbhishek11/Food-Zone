<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_explore_shared_sections_are_cached_60s(): void
    {
        // Warm the cache.
        $this->getJson('/api/v1/explore')->assertOk();
        $this->assertNotNull(Cache::get('explore:shared'));

        // Mutate underlying data — without a cache, trending_hashtags would
        // reflect it. With caching, the second call serves the stale payload.
        Post::factory()->create(['body' => '#brandnew tag']);
        $tags = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_hashtags');
        $this->assertEmpty(array_filter($tags, fn ($t) => $t['tag'] === 'brandnew'));

        // Bust the cache → the new tag shows up.
        Cache::forget('explore:shared');
        $tags = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_hashtags');
        $this->assertNotEmpty(array_filter($tags, fn ($t) => $t['tag'] === 'brandnew'));
    }

    public function test_vendor_menu_is_cached_by_vendor_id(): void
    {
        $vendor = Vendor::factory()->create();
        $cat = MenuCategory::create(['vendor_id' => $vendor->id, 'name' => 'Mains', 'status' => 'approved', 'sort_order' => 0]);
        MenuItem::factory()->create(['vendor_id' => $vendor->id, 'category_id' => $cat->id, 'name' => 'Burger']);

        $first = $this->getJson("/api/v1/vendors/{$vendor->id}/menu")->assertOk();
        $this->assertNotNull(Cache::get("vendor:{$vendor->id}:menu"));

        // Stealth-edit a name in the DB without going through the controller
        // so the cache is unaffected. The second call should still see "Burger".
        DB::table('menu_items')->where('vendor_id', $vendor->id)->update(['name' => 'Pizza']);
        $second = $this->getJson("/api/v1/vendors/{$vendor->id}/menu")->assertOk()->json('data');
        $this->assertSame($first->json('data.categories.0.items.0.name'), $second['categories'][0]['items'][0]['name']);

        // After forgetting the key, the new name shows.
        Cache::forget("vendor:{$vendor->id}:menu");
        $third = $this->getJson("/api/v1/vendors/{$vendor->id}/menu")->assertOk()->json('data');
        $this->assertSame('Pizza', $third['categories'][0]['items'][0]['name']);
    }

    public function test_indexes_migration_creates_expected_indexes(): void
    {
        // Smoke-check: the migration ran (RefreshDatabase ran all migrations).
        // We probe via PRAGMA on SQLite which is what the test suite uses.
        $indexes = collect(DB::select("SELECT name FROM sqlite_master WHERE type='index'"))
            ->pluck('name')
            ->all();

        $this->assertContains('orders_vendor_id_created_at_index', $indexes);
        $this->assertContains('orders_user_id_created_at_index', $indexes);
        $this->assertContains('notifications_user_id_created_at_index', $indexes);
        $this->assertContains('follows_follower_id_status_index', $indexes);
        $this->assertContains('post_comments_post_id_created_at_index', $indexes);
    }
}
