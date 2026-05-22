<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_analytics_returns_series_and_distributions(): void
    {
        $vendor = Vendor::factory()->create(['orders_count' => 5]);
        $customer = User::factory()->create();
        Order::create([
            'order_number' => 'FZ-A1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 200, 'total' => 200,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs(User::factory()->admin()->create());
        $res = $this->getJson('/api/v1/admin/analytics?days=7')->assertOk();

        $res->assertJsonPath('data.range_days', 7)
            ->assertJsonStructure(['data' => [
                'revenue_series' => [['date', 'orders', 'revenue']],
                'users_series' => [['date', 'count']],
                'status_distribution',
                'top_vendors',
            ]]);
        $this->assertCount(7, $res->json('data.revenue_series'));
    }

    public function test_admin_orders_monitoring_is_filterable(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        Order::create([
            'order_number' => 'FZ-MON-1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);
        Order::create([
            'order_number' => 'FZ-MON-2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/v1/admin/orders?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', 'FZ-MON-1')
            ->assertJsonPath('data.0.customer.id', $customer->id);
    }

    public function test_bulk_user_action_bans_multiple_non_admins(): void
    {
        $admin = User::factory()->admin()->create();
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $protectedAdmin = User::factory()->admin()->create();

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/admin/users/bulk', [
            'action' => 'ban',
            'user_ids' => [$u1->id, $u2->id, $protectedAdmin->id],
        ])->assertOk()->assertJsonPath('data.affected', 2);

        $this->assertEquals('banned', $u1->fresh()->status->value);
        $this->assertEquals('banned', $u2->fresh()->status->value);
        // The admin in the list is protected and stays active.
        $this->assertEquals('active', $protectedAdmin->fresh()->status->value);
    }

    public function test_bulk_suspend_requires_days(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $this->postJson('/api/v1/admin/users/bulk', [
            'action' => 'suspend',
            'user_ids' => [User::factory()->create()->id],
        ])->assertStatus(422);
    }

    public function test_non_admin_cannot_reach_analytics(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/admin/analytics')->assertStatus(403);
    }
}
