<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function vendorWithItem(array $vendorAttrs = [], float $price = 200): array
    {
        $vendor = Vendor::factory()->create($vendorAttrs);
        $item = MenuItem::factory()->for($vendor)->create(['price' => $price]);

        return [$vendor, $item];
    }

    public function test_customer_can_place_an_order_with_commission_calculated(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['commission_rate' => 5, 'delivery_fee' => 20], 100);
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'items' => [['item_id' => $item->id, 'quantity' => 2]],
        ])->assertCreated();

        // subtotal 200, delivery 20, total 220, commission 5% of 200 = 10
        $response->assertJsonPath('data.subtotal', 200)
            ->assertJsonPath('data.delivery_charge', 20)
            ->assertJsonPath('data.total', 220)
            ->assertJsonPath('data.commission', 10)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('orders', ['vendor_id' => $vendor->id, 'user_id' => $customer->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $vendor->user_id, 'type' => 'order_placed']);
    }

    public function test_order_applies_a_valid_voucher(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['delivery_fee' => 0], 300);
        $customer = User::factory()->create();
        Voucher::create([
            'code' => 'SAVE50', 'type' => 'flat', 'amount' => 50,
            'min_order' => 100, 'per_user_limit' => 1, 'is_active' => true,
        ]);

        Sanctum::actingAs($customer);
        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'voucher_code' => 'SAVE50',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.discount', 50)
            ->assertJsonPath('data.total', 250);

        $this->assertDatabaseHas('voucher_redemptions', ['discount_applied' => 50]);
    }

    public function test_order_rejected_when_below_minimum_order_value(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['min_order_value' => 500], 100);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_cannot_order_from_closed_store(): void
    {
        [$vendor, $item] = $this->vendorWithItem();
        $vendor->update(['is_open' => false]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_vendor_can_advance_order_status_but_not_skip(): void
    {
        [$vendor, $item] = $this->vendorWithItem();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-TEST-1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);

        Sanctum::actingAs($vendor->user);

        // Illegal jump pending -> delivered is blocked.
        $this->postJson("/api/v1/vendor/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(422);

        // Legal: pending -> accepted.
        $this->postJson("/api/v1/vendor/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        $this->assertNotNull($order->fresh()->accepted_at);
    }

    public function test_customer_can_cancel_pending_order_only(): void
    {
        [$vendor, $item] = $this->vendorWithItem();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-TEST-2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Accepted->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertStatus(422);

        $order->update(['status' => OrderStatus::Pending->value]);
        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_customer_can_rate_delivered_order(): void
    {
        [$vendor, $item] = $this->vendorWithItem();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-TEST-3', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/rate", [
            'rating' => 5,
            'review' => 'Absolutely loved the food and service!',
        ])->assertCreated();

        $this->assertDatabaseHas('order_ratings', ['order_id' => $order->id, 'rating' => 5]);
        $this->assertEquals(5.0, $vendor->fresh()->rating_avg);
        $this->assertEquals(1, $vendor->fresh()->rating_count);
    }

    public function test_vendor_role_cannot_place_orders(): void
    {
        [$vendor, $item] = $this->vendorWithItem();
        Sanctum::actingAs($vendor->user); // role = vendor

        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(403);
    }
}
