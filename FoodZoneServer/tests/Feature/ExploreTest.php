<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\VendorStatus;
use App\Models\Follow;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExploreTest extends TestCase
{
    use RefreshDatabase;

    public function test_explore_returns_all_section_keys(): void
    {
        $this->getJson('/api/v1/explore')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'trending_posts',
                    'trending_vendors',
                    'trending_hashtags',
                    'trending_items',
                    'suggested_users',
                    'nearby_vendors',
                ],
            ]);
    }

    public function test_trending_posts_orders_by_weighted_engagement(): void
    {
        $low = Post::factory()->create(['likes_count' => 1, 'comments_count' => 0, 'shares_count' => 0]);
        $high = Post::factory()->create(['likes_count' => 2, 'comments_count' => 5, 'shares_count' => 4]);
        $mid = Post::factory()->create(['likes_count' => 10, 'comments_count' => 0, 'shares_count' => 0]);

        $res = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_posts');

        $ids = array_column($res, 'id');
        // Score: high = 2 + 10 + 12 = 24; mid = 10; low = 1.
        $this->assertSame([$high->id, $mid->id, $low->id], $ids);
    }

    public function test_trending_hashtags_aggregates_from_post_bodies(): void
    {
        Post::factory()->create(['body' => 'Loving #pizza and #burgers today']);
        Post::factory()->create(['body' => 'More #pizza pls']);
        Post::factory()->create(['body' => 'Trying #ramen']);

        $tags = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_hashtags');

        $byTag = collect($tags)->keyBy('tag');
        $this->assertSame(2, $byTag['pizza']['count']);
        $this->assertSame(1, $byTag['burgers']['count']);
        $this->assertSame(1, $byTag['ramen']['count']);
    }

    public function test_trending_vendors_returns_order_delta_against_prior_window(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();

        $make = function ($when) use ($vendor, $customer): void {
            static $n = 0;
            $n++;
            $order = new Order([
                'order_number' => 'FZ-EX-'.$n,
                'user_id' => $customer->id,
                'vendor_id' => $vendor->id,
                'status' => OrderStatus::Delivered->value,
                'subtotal' => 100, 'total' => 110, 'commission' => 10,
                'payment_method' => 'cod', 'payment_status' => 'paid',
            ]);
            $order->timestamps = false;
            $order->created_at = $when;
            $order->updated_at = $when;
            $order->save();
        };

        // Prior window (24-48h ago): 2 orders.
        $make(now()->subHours(36));
        $make(now()->subHours(36));
        // Recent window (last 24h): 4 orders → +100% delta.
        $make(now()->subHours(2));
        $make(now()->subHours(2));
        $make(now()->subHours(2));
        $make(now()->subHours(2));

        $rows = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_vendors');

        $this->assertNotEmpty($rows);
        $this->assertSame($vendor->id, $rows[0]['vendor']['id']);
        $this->assertSame(4, $rows[0]['orders_24h']);
        $this->assertSame(100, $rows[0]['order_delta']);
    }

    public function test_trending_items_sums_quantities_in_last_24h(): void
    {
        $vendor = Vendor::factory()->create();
        $item = MenuItem::factory()->create(['vendor_id' => $vendor->id]);
        $customer = User::factory()->create();

        $order = Order::create([
            'order_number' => 'FZ-EX-IT-1',
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value,
            'subtotal' => 300, 'total' => 320, 'commission' => 15,
            'payment_method' => 'cod', 'payment_status' => 'paid',
            'created_at' => now()->subHours(3),
            'updated_at' => now()->subHours(3),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'item_id' => $item->id,
            'item_name' => $item->name,
            'unit_price' => 100,
            'quantity' => 3,
            'line_total' => 300,
        ]);

        $items = $this->getJson('/api/v1/explore')->assertOk()->json('data.trending_items');

        $this->assertCount(1, $items);
        $this->assertSame($item->id, $items[0]['item']['id']);
        $this->assertSame(3, $items[0]['recent_orders']);
    }

    public function test_suggested_users_uses_friends_of_friends(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $candidate = User::factory()->create();

        // I follow friend; friend follows candidate.
        Follow::create(['follower_id' => $me->id, 'following_id' => $friend->id, 'status' => 'accepted']);
        Follow::create(['follower_id' => $friend->id, 'following_id' => $candidate->id, 'status' => 'accepted']);

        Sanctum::actingAs($me);

        $rows = $this->getJson('/api/v1/explore')->assertOk()->json('data.suggested_users');

        $this->assertNotEmpty($rows);
        $this->assertSame($candidate->id, $rows[0]['user']['id']);
        $this->assertSame(1, $rows[0]['mutual_count']);
        $this->assertSame('mutuals', $rows[0]['reason']);
    }

    public function test_suggested_users_falls_back_to_popular_when_no_follows(): void
    {
        $me = User::factory()->create();
        $popular = User::factory()->create();
        Follow::create(['follower_id' => User::factory()->create()->id, 'following_id' => $popular->id, 'status' => 'accepted']);

        Sanctum::actingAs($me);

        $rows = $this->getJson('/api/v1/explore')->assertOk()->json('data.suggested_users');

        $this->assertNotEmpty($rows);
        $this->assertSame('popular', $rows[0]['reason']);
        $this->assertSame(0, $rows[0]['mutual_count']);
    }

    public function test_nearby_vendors_filters_by_radius_with_php_haversine(): void
    {
        // Vendors near and far from (0,0).
        $near = Vendor::factory()->create(['lat' => 0.01, 'lng' => 0.01]); // ~1.5 km
        Vendor::factory()->create(['lat' => 10.0, 'lng' => 10.0]);          // ~1500 km

        $rows = $this->getJson('/api/v1/explore?lat=0&lng=0&radius=5')
            ->assertOk()
            ->json('data.nearby_vendors');

        $this->assertCount(1, $rows);
        $this->assertSame($near->id, $rows[0]['id']);
        $this->assertArrayHasKey('distance_km', $rows[0]);
    }

    public function test_explore_map_returns_only_approved_vendors_with_coords(): void
    {
        Vendor::factory()->create(['lat' => 12.97, 'lng' => 77.59]);
        Vendor::factory()->create(['lat' => null, 'lng' => null]);
        Vendor::factory()->pending()->create(['lat' => 12.97, 'lng' => 77.59]);

        $vendors = $this->getJson('/api/v1/explore/map')->assertOk()->json('data');

        $this->assertCount(1, $vendors);
        $this->assertSame(12.97, (float) $vendors[0]['lat']);
    }
}
