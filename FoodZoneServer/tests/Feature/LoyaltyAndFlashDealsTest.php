<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Badge;
use App\Models\FlashDeal;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderRating;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\Vendor;
use App\Services\LoyaltyService;
use Database\Seeders\BadgesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LoyaltyAndFlashDealsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BadgesSeeder::class);
    }

    public function test_delivered_order_awards_one_point_per_ten_rupees_plus_first_order_bonus(): void
    {
        $me = User::factory()->create();
        $vendor = Vendor::factory()->create();

        // ₹220 total → 22 pts; first-order bonus → +50.
        $order = Order::create([
            'order_number' => 'FZ-L-1', 'user_id' => $me->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value,
            'subtotal' => 200, 'total' => 220, 'commission' => 22,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        app(LoyaltyService::class)->awardForDelivery($order);

        $this->assertDatabaseHas('user_loyalty', [
            'user_id' => $me->id,
            'points' => 72,
            'lifetime_points' => 72,
            'tier' => 'bronze',
        ]);

        $this->assertDatabaseHas('loyalty_transactions', ['user_id' => $me->id, 'reason' => 'first_order_bonus']);
    }

    public function test_loyalty_award_is_idempotent_per_order(): void
    {
        $me = User::factory()->create();
        $vendor = Vendor::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-L-2', 'user_id' => $me->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        $svc = app(LoyaltyService::class);
        $svc->awardForDelivery($order);
        $svc->awardForDelivery($order);

        $this->assertSame(1, \App\Models\LoyaltyTransaction::where('user_id', $me->id)->where('reason', 'order')->count());
    }

    public function test_tier_promotes_when_lifetime_crosses_threshold(): void
    {
        $me = User::factory()->create();
        $vendor = Vendor::factory()->create();
        // ₹6000 → 600 pts + first-order 50 = 650. Silver (≥500).
        $order = Order::create([
            'order_number' => 'FZ-L-3', 'user_id' => $me->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 6000, 'total' => 6000,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        app(LoyaltyService::class)->awardForDelivery($order);

        $this->assertDatabaseHas('user_loyalty', ['user_id' => $me->id, 'tier' => 'silver']);
    }

    public function test_first_order_badge_unlocks_after_delivery(): void
    {
        $me = User::factory()->create();
        $vendor = Vendor::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-L-4', 'user_id' => $me->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        app(LoyaltyService::class)->awardForDelivery($order);

        $badge = Badge::where('key', 'first_order')->first();
        $this->assertDatabaseHas('user_badges', ['user_id' => $me->id, 'badge_id' => $badge->id]);
    }

    public function test_me_loyalty_endpoint_returns_points_tier_and_badges(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/v1/me/loyalty')->assertOk();

        $this->assertSame(0, $res->json('data.points'));
        $this->assertSame('bronze', $res->json('data.tier'));
        $this->assertNotEmpty($res->json('data.badges'));
        $this->assertSame(500, $res->json('data.next_tier.points_to_go'));
    }

    public function test_leaderboard_ranks_users_by_points(): void
    {
        $high = User::factory()->create();
        $low = User::factory()->create();
        \App\Models\UserLoyalty::create(['user_id' => $high->id, 'points' => 0, 'lifetime_points' => 2500, 'tier' => 'gold']);
        \App\Models\UserLoyalty::create(['user_id' => $low->id,  'points' => 0, 'lifetime_points' => 100,  'tier' => 'bronze']);

        $entries = $this->getJson('/api/v1/leaderboard?type=points')->assertOk()->json('data.entries');

        $this->assertSame($high->id, $entries[0]['user']['id']);
        $this->assertSame(2500, $entries[0]['score']);
        $this->assertSame(1, $entries[0]['rank']);
    }

    public function test_leaderboard_orders_type_counts_delivered_orders(): void
    {
        $top = User::factory()->create();
        $other = User::factory()->create();
        $vendor = Vendor::factory()->create();

        for ($i = 0; $i < 3; $i++) {
            Order::create([
                'order_number' => 'FZ-LB-'.$top->id.'-'.$i, 'user_id' => $top->id, 'vendor_id' => $vendor->id,
                'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
                'payment_method' => 'cod', 'payment_status' => 'paid',
            ]);
        }
        Order::create([
            'order_number' => 'FZ-LB-O-1', 'user_id' => $other->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        $entries = $this->getJson('/api/v1/leaderboard?type=orders')->assertOk()->json('data.entries');

        $this->assertSame($top->id, $entries[0]['user']['id']);
        $this->assertSame(3, $entries[0]['score']);
    }

    public function test_flash_deals_endpoint_returns_active_deals_with_deal_price(): void
    {
        $vendor = Vendor::factory()->create();
        $item = MenuItem::factory()->create(['vendor_id' => $vendor->id, 'price' => 200]);

        FlashDeal::create([
            'vendor_id' => $vendor->id, 'item_id' => $item->id,
            'discount_percent' => 25,
            'starts_at' => now()->subMinutes(10),
            'ends_at' => now()->addHour(),
        ]);
        // An expired deal should be filtered out.
        FlashDeal::create([
            'vendor_id' => $vendor->id, 'item_id' => $item->id,
            'discount_percent' => 50,
            'starts_at' => now()->subHours(3),
            'ends_at' => now()->subHour(),
        ]);

        $deals = $this->getJson('/api/v1/flash-deals')->assertOk()->json('data');

        $this->assertCount(1, $deals);
        $this->assertSame(25, $deals[0]['discount_percent']);
        $this->assertSame(150, $deals[0]['deal_price']);
    }
}
