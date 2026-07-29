<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Violation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_a_full_user_detail_panel(): void
    {
        $target = User::factory()->create();
        $vendor = Vendor::factory()->create();
        Order::create([
            'order_number' => 'FZ-DETAIL-1', 'user_id' => $target->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 200, 'total' => 200,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        Post::factory()->create(['user_id' => $target->id]);
        Violation::create(['user_id' => $target->id, 'type' => 'spam', 'status' => 'open']);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $res = $this->getJson("/api/v1/admin/users/{$target->id}")->assertOk();
        $res->assertJsonPath('data.stats.orders_count', 1)
            ->assertJsonPath('data.stats.orders_total_spent', 200)
            ->assertJsonPath('data.stats.posts_count', 1)
            ->assertJsonPath('data.stats.violations_count', 1)
            ->assertJsonPath('data.stats.violations_open', 1)
            ->assertJsonCount(1, 'data.recent_orders')
            ->assertJsonCount(1, 'data.recent_posts')
            ->assertJsonCount(1, 'data.recent_violations');
    }

    public function test_non_admin_cannot_view_user_detail(): void
    {
        $target = User::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/v1/admin/users/{$target->id}")->assertStatus(403);
    }
}
