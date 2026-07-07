<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CancelStaleOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(string $status, \DateTimeInterface $createdAt): Order
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();

        $order = Order::create([
            'order_number' => 'FZ-'.fake()->unique()->numerify('####'),
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => $status,
            'subtotal' => 100,
            'total' => 100,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
        ]);
        $order->timestamps = false;
        $order->forceFill(['created_at' => $createdAt])->save();

        return $order->fresh();
    }

    public function test_stale_pending_orders_are_cancelled_and_customer_notified(): void
    {
        config(['orders.acceptance_window_minutes' => 15]);

        $stale = $this->makeOrder(OrderStatus::Pending->value, now()->subMinutes(20));
        $fresh = $this->makeOrder(OrderStatus::Pending->value, now()->subMinutes(5));
        $accepted = $this->makeOrder(OrderStatus::Accepted->value, now()->subHours(2));

        $this->artisan('orders:cancel-stale')->assertSuccessful();

        $this->assertEquals(OrderStatus::Cancelled->value, $stale->fresh()->status->value);
        $this->assertEquals(OrderStatus::Pending->value, $fresh->fresh()->status->value);
        $this->assertEquals(OrderStatus::Accepted->value, $accepted->fresh()->status->value);

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $stale->id,
            'status' => OrderStatus::Cancelled->value,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $stale->user_id,
            'type' => 'order_status',
        ]);
    }

    public function test_disabled_window_cancels_nothing(): void
    {
        config(['orders.acceptance_window_minutes' => 0]);

        $stale = $this->makeOrder(OrderStatus::Pending->value, now()->subHours(3));

        $this->artisan('orders:cancel-stale')->assertSuccessful();

        $this->assertEquals(OrderStatus::Pending->value, $stale->fresh()->status->value);
    }
}
