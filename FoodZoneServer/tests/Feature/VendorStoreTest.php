<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_returns_discovery_fields(): void
    {
        $vendor = Vendor::factory()->create([
            'prep_time_minutes' => 25,
            'tags' => ['Indian', 'Fast Food'],
        ]);

        $this->getJson("/api/v1/vendors/{$vendor->id}")
            ->assertOk()
            ->assertJsonPath('data.tags.0', 'Indian')
            ->assertJsonPath('data.delivery_estimate_min', 25)
            ->assertJsonPath('data.delivery_estimate_max', 40)
            ->assertJsonPath('data.has_offer', false);
    }

    public function test_menu_includes_popular_items(): void
    {
        $vendor = Vendor::factory()->create();
        $hot = MenuItem::factory()->for($vendor)->create();
        $hot->forceFill(['orders_count' => 50])->save();
        $cold = MenuItem::factory()->for($vendor)->create();
        $cold->forceFill(['orders_count' => 1])->save();

        $popular = $this->getJson("/api/v1/vendors/{$vendor->id}/menu")
            ->assertOk()
            ->json('data.popular_items');
        $this->assertEquals($hot->id, $popular[0]);
    }

    public function test_nearby_orders_by_distance(): void
    {
        $close = Vendor::factory()->create(['lat' => 19.075, 'lng' => 72.877]); // ~Mumbai
        $far = Vendor::factory()->create(['lat' => 12.971, 'lng' => 77.594]);   // ~Bengaluru

        $ids = collect(
            $this->getJson('/api/v1/vendors/nearby?lat=19.076&lng=72.878&radius=50')
                ->assertOk()
                ->json('data'),
        )->pluck('id');

        $this->assertEquals($close->id, $ids->first());
        $this->assertNotContains($far->id, $ids);
    }

    public function test_items_trending_returns_recent_top(): void
    {
        $vendor = Vendor::factory()->create();
        $hot = MenuItem::factory()->for($vendor)->create();
        $cold = MenuItem::factory()->for($vendor)->create();

        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-T-1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        OrderItem::create(['order_id' => $order->id, 'item_id' => $hot->id, 'item_name' => $hot->name, 'quantity' => 5, 'unit_price' => 100, 'line_total' => 500]);
        OrderItem::create(['order_id' => $order->id, 'item_id' => $cold->id, 'item_name' => $cold->name, 'quantity' => 1, 'unit_price' => 100, 'line_total' => 100]);

        $ids = collect($this->getJson('/api/v1/items/trending')->assertOk()->json('data'))->pluck('item.id');
        $this->assertEquals($hot->id, $ids->first());
    }

    public function test_user_can_report_a_vendor(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/vendors/{$vendor->id}/report", [
            'reason' => 'spam',
            'detail' => 'They keep sending duplicate promos.',
        ])->assertCreated();

        $this->assertDatabaseHas('vendor_reports', ['vendor_id' => $vendor->id, 'reason' => 'spam']);
    }
}
