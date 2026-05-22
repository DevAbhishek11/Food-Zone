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

class VendorAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_analytics_returns_series_and_top_items(): void
    {
        $vendor = Vendor::factory()->create();
        MenuItem::factory()->for($vendor)->create(['orders_count' => 12]);
        $customer = User::factory()->create();
        Order::create([
            'order_number' => 'FZ-VA1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 300, 'total' => 300,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs($vendor->user);
        $res = $this->getJson('/api/v1/vendor/analytics?days=7')->assertOk();
        $res->assertJsonPath('data.range_days', 7)
            ->assertJsonStructure(['data' => ['revenue_series', 'status_distribution', 'top_items', 'lifetime_revenue']]);
        $this->assertCount(7, $res->json('data.revenue_series'));
        $this->assertEquals(300, $res->json('data.lifetime_revenue'));
    }

    public function test_non_vendor_cannot_access_vendor_analytics(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/vendor/analytics')->assertStatus(403);
    }

    public function test_vendor_can_set_and_read_operating_hours(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $this->putJson('/api/v1/vendor/hours', [
            'hours' => [
                ['day_of_week' => 1, 'is_closed' => false, 'open_time' => '09:00', 'close_time' => '22:00'],
                ['day_of_week' => 0, 'is_closed' => true],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('operating_hours', [
            'vendor_id' => $vendor->id, 'day_of_week' => 1, 'is_closed' => false,
        ]);
        $this->assertDatabaseHas('operating_hours', [
            'vendor_id' => $vendor->id, 'day_of_week' => 0, 'is_closed' => true,
        ]);

        $this->getJson('/api/v1/vendor/hours')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_updating_hours_is_idempotent_per_day(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $payload = ['hours' => [['day_of_week' => 2, 'is_closed' => false, 'open_time' => '10:00', 'close_time' => '20:00']]];
        $this->putJson('/api/v1/vendor/hours', $payload)->assertOk();
        $this->putJson('/api/v1/vendor/hours', $payload)->assertOk();

        $this->assertEquals(1, $vendor->operatingHours()->where('day_of_week', 2)->count());
    }
}
