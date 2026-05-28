<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\InventoryItem;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorDashboardV3Test extends TestCase
{
    use RefreshDatabase;

    public function test_customers_lists_orderers_with_stats(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        Order::create([
            'order_number' => 'FZ-V3-1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 200, 'total' => 220,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs($vendor->user);
        $this->getJson('/api/v1/vendor/customers')
            ->assertOk()
            ->assertJsonPath('data.0.id', $customer->id)
            ->assertJsonPath('data.0.orders_count', 1)
            ->assertJsonPath('data.0.total_spend', 220)
            ->assertJsonPath('data.0.display_name', 'Customer #'.$customer->id);
    }

    public function test_warn_sends_a_system_notification_and_block_persists(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        Sanctum::actingAs($vendor->user);

        $this->postJson("/api/v1/vendor/customers/{$customer->id}/warn", ['message' => 'No more cancellations please.'])
            ->assertCreated();
        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'type' => 'system']);

        $this->postJson("/api/v1/vendor/customers/{$customer->id}/block", ['reason' => 'repeated abuse'])
            ->assertCreated();
        $this->assertDatabaseHas('vendor_user_blocks', ['vendor_id' => $vendor->id, 'user_id' => $customer->id]);

        $this->deleteJson("/api/v1/vendor/customers/{$customer->id}/block")->assertOk();
        $this->assertDatabaseMissing('vendor_user_blocks', ['vendor_id' => $vendor->id, 'user_id' => $customer->id]);
    }

    public function test_inventory_crud_and_adjust(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $id = $this->postJson('/api/v1/vendor/inventory', [
            'name' => 'Tomato', 'unit' => 'kg', 'stock' => 5, 'threshold' => 2,
        ])->assertCreated()->json('data.id');

        $this->getJson('/api/v1/vendor/inventory')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'ok');

        // Adjust negative — stock to 1 → status low (threshold 2).
        $this->postJson("/api/v1/vendor/inventory/{$id}/adjust", ['delta' => -4, 'reason' => 'used'])
            ->assertOk()
            ->assertJsonPath('data.status', 'low');

        $this->putJson("/api/v1/vendor/inventory/{$id}", ['threshold' => 0.5])->assertOk();
        $this->deleteJson("/api/v1/vendor/inventory/{$id}")->assertOk();
    }

    public function test_voucher_crud_for_vendor(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $id = $this->postJson('/api/v1/vendor/vouchers', [
            'code' => 'FOOD10', 'type' => 'percentage', 'amount' => 10, 'min_order' => 200,
        ])->assertCreated()->json('data.id');

        $this->putJson("/api/v1/vendor/vouchers/{$id}", ['amount' => 15])
            ->assertOk()
            ->assertJsonPath('data.amount', 15);

        $this->deleteJson("/api/v1/vendor/vouchers/{$id}")->assertOk();
        $this->assertDatabaseMissing('vouchers', ['id' => $id]);
    }

    public function test_items_analytics_ranks_by_revenue(): void
    {
        $vendor = Vendor::factory()->create();
        $hot = MenuItem::factory()->for($vendor)->create();
        $cold = MenuItem::factory()->for($vendor)->create();
        $customer = User::factory()->create();

        $order = Order::create([
            'order_number' => 'FZ-V3-2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 0, 'total' => 0,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        OrderItem::create(['order_id' => $order->id, 'item_id' => $hot->id, 'item_name' => $hot->name, 'quantity' => 4, 'unit_price' => 100, 'line_total' => 400]);
        OrderItem::create(['order_id' => $order->id, 'item_id' => $cold->id, 'item_name' => $cold->name, 'quantity' => 1, 'unit_price' => 100, 'line_total' => 100]);

        Sanctum::actingAs($vendor->user);
        $data = $this->getJson('/api/v1/vendor/analytics/items')->assertOk()->json('data');
        $this->assertEquals($hot->id, $data[0]['item_id']);
        $this->assertEquals(400.0, $data[0]['revenue']);
    }

    public function test_payouts_aggregate_by_day(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        Order::create([
            'order_number' => 'FZ-V3-3', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value,
            'subtotal' => 1000, 'total' => 1100, 'commission' => 100,
            'payment_method' => 'upi', 'payment_status' => 'paid',
            'delivered_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($vendor->user);
        $row = $this->getJson('/api/v1/vendor/payouts')->assertOk()->json('data.0');
        $this->assertEquals(1100.0, $row['gross']);
        $this->assertEquals(100.0, $row['commission']);
        $this->assertEquals(1000.0, $row['net']);
    }

    public function test_flash_deal_must_be_own_item(): void
    {
        $vendor = Vendor::factory()->create();
        $other = Vendor::factory()->create();
        $otherItem = MenuItem::factory()->for($other)->create();

        Sanctum::actingAs($vendor->user);
        $this->postJson('/api/v1/vendor/flash-deals', [
            'item_id' => $otherItem->id, 'discount_percent' => 20,
            'starts_at' => now()->toIso8601String(), 'ends_at' => now()->addHours(2)->toIso8601String(),
        ])->assertStatus(422);

        $own = MenuItem::factory()->for($vendor)->create();
        $this->postJson('/api/v1/vendor/flash-deals', [
            'item_id' => $own->id, 'discount_percent' => 20,
            'starts_at' => now()->toIso8601String(), 'ends_at' => now()->addHours(2)->toIso8601String(),
        ])->assertCreated();
    }
}
