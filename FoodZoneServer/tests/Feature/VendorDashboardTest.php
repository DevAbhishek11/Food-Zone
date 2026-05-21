<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_stats_reports_operational_metrics(): void
    {
        $vendor = Vendor::factory()->create(['orders_count' => 3, 'rating_avg' => 4.5, 'rating_count' => 2]);
        MenuItem::factory(2)->for($vendor)->create();
        $customer = User::factory()->create();

        Order::create([
            'order_number' => 'FZ-S1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);
        Order::create([
            'order_number' => 'FZ-S2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 250, 'total' => 250,
            'payment_method' => 'cod', 'payment_status' => 'paid', 'delivered_at' => now(),
        ]);

        Sanctum::actingAs($vendor->user);
        $this->getJson('/api/v1/vendor/stats')
            ->assertOk()
            ->assertJsonPath('data.pending_orders', 1)
            ->assertJsonPath('data.orders_today', 2)
            ->assertJsonPath('data.revenue_today', 250)
            ->assertJsonPath('data.menu_items', 2)
            ->assertJsonPath('data.rating_avg', 4.5);
    }

    public function test_non_vendor_cannot_access_vendor_stats(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/vendor/stats')->assertStatus(403);
    }

    public function test_vendor_can_list_and_advance_their_orders(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-S3', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);

        Sanctum::actingAs($vendor->user);
        $this->getJson('/api/v1/vendor/orders')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/vendor/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertOk()->assertJsonPath('data.status', 'accepted');
    }
}
