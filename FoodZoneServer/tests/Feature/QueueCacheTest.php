<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Jobs\RecalculateVendorRating;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QueueCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_rating_dispatches_recalculate_vendor_rating_job(): void
    {
        Queue::fake();

        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-Q1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/rate", [
            'rating' => 5,
            'review' => 'Genuinely excellent — fast and delicious!',
        ])->assertCreated();

        Queue::assertPushed(RecalculateVendorRating::class, fn ($job) => $job->vendorId === $vendor->id);
    }

    public function test_recalculate_job_updates_vendor_aggregate(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-Q2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        $order->rating()->create(['user_id' => $customer->id, 'vendor_id' => $vendor->id, 'rating' => 4]);

        (new RecalculateVendorRating($vendor->id))->handle();

        $this->assertEquals(4.0, $vendor->fresh()->rating_avg);
        $this->assertEquals(1, $vendor->fresh()->rating_count);
    }

    public function test_admin_analytics_is_cached(): void
    {
        Cache::flush();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/analytics?days=7')->assertOk();
        $this->assertTrue(Cache::has('admin:analytics:7'));
    }

    public function test_vendor_analytics_is_cached(): void
    {
        Cache::flush();
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $this->getJson('/api/v1/vendor/analytics?days=7')->assertOk();
        $this->assertTrue(Cache::has("vendor:{$vendor->id}:analytics:7"));
    }
}
