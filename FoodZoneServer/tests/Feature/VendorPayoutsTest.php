<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorPayoutsTest extends TestCase
{
    use RefreshDatabase;

    private function deliveredOrder(Vendor $vendor, string $paymentStatus, float $total, float $commission): Order
    {
        return Order::create([
            'order_number' => 'FZ-PO-'.uniqid(),
            'user_id' => User::factory()->create()->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value,
            'subtotal' => $total, 'total' => $total, 'commission' => $commission,
            'payment_method' => 'upi', 'payment_status' => $paymentStatus,
            'delivered_at' => now()->subDay(),
        ]);
    }

    public function test_refunded_orders_are_excluded_from_payouts(): void
    {
        $vendor = Vendor::factory()->create();
        $this->deliveredOrder($vendor, 'paid', 1000, 100);
        $this->deliveredOrder($vendor, 'refunded', 500, 50); // must not count

        Sanctum::actingAs($vendor->user);
        $res = $this->getJson('/api/v1/vendor/payouts')->assertOk();

        $res->assertJsonPath('data.lifetime_gross', 1000)
            ->assertJsonPath('data.lifetime_commission', 100)
            ->assertJsonPath('data.lifetime_net', 900)
            ->assertJsonPath('data.refunded_orders_excluded', 1);
        $this->assertCount(1, $res->json('data.series'));
    }

    public function test_lifetime_totals_ignore_the_days_window(): void
    {
        $vendor = Vendor::factory()->create();
        $old = $this->deliveredOrder($vendor, 'paid', 200, 20);
        $old->forceFill(['delivered_at' => now()->subDays(60)])->save();

        Sanctum::actingAs($vendor->user);
        $res = $this->getJson('/api/v1/vendor/payouts?days=30')->assertOk();

        // Outside the 30-day series window...
        $this->assertCount(0, $res->json('data.series'));
        // ...but still counted in the lifetime summary.
        $res->assertJsonPath('data.lifetime_gross', 200);
    }

    public function test_week_grouping_is_accepted(): void
    {
        $vendor = Vendor::factory()->create();
        $this->deliveredOrder($vendor, 'paid', 300, 30);

        Sanctum::actingAs($vendor->user);
        $this->getJson('/api/v1/vendor/payouts?group=week')
            ->assertOk()
            ->assertJsonPath('data.group', 'week');
    }

    public function test_non_owner_cannot_view_another_vendors_payouts(): void
    {
        Vendor::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/vendor/payouts')->assertStatus(403);
    }
}
