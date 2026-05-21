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

class FavoriteReorderTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_favorite_and_unfavorite_a_vendor(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/vendors/{$vendor->id}/favorite")
            ->assertOk()->assertJsonPath('data.is_favorited', true);
        $this->assertDatabaseHas('favorites', ['user_id' => $user->id, 'vendor_id' => $vendor->id]);

        $this->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $vendor->id)
            ->assertJsonPath('data.0.is_favorited', true);

        $this->deleteJson("/api/v1/vendors/{$vendor->id}/favorite")
            ->assertOk()->assertJsonPath('data.is_favorited', false);
        $this->assertDatabaseMissing('favorites', ['user_id' => $user->id, 'vendor_id' => $vendor->id]);
    }

    public function test_favoriting_is_idempotent(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/vendors/{$vendor->id}/favorite")->assertOk();
        $this->postJson("/api/v1/vendors/{$vendor->id}/favorite")->assertOk();

        $this->assertEquals(1, $user->favorites()->count());
    }

    public function test_vendor_show_reports_favorited_flag_for_viewer(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create();
        $user->favorites()->create(['vendor_id' => $vendor->id]);

        Sanctum::actingAs($user);
        $this->getJson("/api/v1/vendors/{$vendor->slug}")
            ->assertOk()
            ->assertJsonPath('data.is_favorited', true);
    }

    public function test_user_can_reorder_a_past_order(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0]);
        $item = MenuItem::factory()->for($vendor)->create(['price' => 120, 'is_available' => true]);
        $customer = User::factory()->create();

        $order = Order::create([
            'order_number' => 'FZ-OLD-1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 240, 'total' => 240,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        OrderItem::create([
            'order_id' => $order->id, 'item_id' => $item->id, 'item_name' => $item->name,
            'quantity' => 2, 'unit_price' => 120, 'line_total' => 240,
        ]);

        Sanctum::actingAs($customer);
        $res = $this->postJson("/api/v1/orders/{$order->id}/reorder")->assertCreated();

        // A brand-new order with the same items at current prices.
        $res->assertJsonPath('data.subtotal', 240)->assertJsonPath('data.status', 'pending');
        $this->assertNotEquals($order->id, $res->json('data.id'));
        $this->assertEquals(2, $customer->orders()->count());
    }

    public function test_reorder_fails_when_no_items_available(): void
    {
        $vendor = Vendor::factory()->create();
        $item = MenuItem::factory()->for($vendor)->unavailable()->create();
        $customer = User::factory()->create();

        $order = Order::create([
            'order_number' => 'FZ-OLD-2', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
        OrderItem::create([
            'order_id' => $order->id, 'item_id' => $item->id, 'item_name' => $item->name,
            'quantity' => 1, 'unit_price' => 100, 'line_total' => 100,
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/reorder")->assertStatus(422);
    }

    public function test_cannot_reorder_someone_elses_order(): void
    {
        $order = Order::create([
            'order_number' => 'FZ-OLD-3', 'user_id' => User::factory()->create()->id,
            'vendor_id' => Vendor::factory()->create()->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/v1/orders/{$order->id}/reorder")->assertStatus(403);
    }
}
