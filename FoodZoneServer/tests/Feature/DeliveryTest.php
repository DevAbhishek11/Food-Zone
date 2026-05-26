<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function readyOrder(string $payment = 'cod'): array
    {
        $vendor = Vendor::factory()->create(['delivery_enabled' => true]);
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-DEL-'.uniqid(),
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Ready->value,
            'subtotal' => 200, 'total' => 220,
            'payment_method' => $payment, 'payment_status' => 'pending',
        ]);

        return [$vendor, $customer, $order];
    }

    private function rider(): User
    {
        return User::factory()->create(['role' => 'delivery']);
    }

    public function test_user_can_register_as_a_delivery_partner(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/delivery/register')
            ->assertOk()
            ->assertJsonPath('data.role', 'delivery');

        $this->assertEquals('delivery', $user->fresh()->role->value);
    }

    public function test_partner_sees_available_unassigned_orders(): void
    {
        [, , $order] = $this->readyOrder();
        Sanctum::actingAs($this->rider());

        $this->getJson('/api/v1/delivery/available')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order->id);
    }

    public function test_partner_can_accept_an_order_and_a_second_cannot(): void
    {
        [$vendor, $customer, $order] = $this->readyOrder();
        $rider = $this->rider();
        Sanctum::actingAs($rider);

        $this->postJson("/api/v1/delivery/orders/{$order->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.delivery_partner.id', $rider->id);

        $this->assertNotNull($order->fresh()->assigned_at);
        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'type' => 'order_status']);

        // A second rider can no longer claim it.
        Sanctum::actingAs($this->rider());
        $this->postJson("/api/v1/delivery/orders/{$order->id}/accept")->assertStatus(422);
    }

    public function test_pickup_then_deliver_moves_status_and_settles_cod(): void
    {
        [, , $order] = $this->readyOrder('cod');
        $rider = $this->rider();
        $order->update(['delivery_partner_id' => $rider->id, 'assigned_at' => now()]);
        Sanctum::actingAs($rider);

        $this->postJson("/api/v1/delivery/orders/{$order->id}/pick-up")
            ->assertOk()
            ->assertJsonPath('data.status', 'out_for_delivery');
        $this->assertNotNull($order->fresh()->picked_up_at);

        $this->postJson("/api/v1/delivery/orders/{$order->id}/deliver")
            ->assertOk()
            ->assertJsonPath('data.status', 'delivered');

        $fresh = $order->fresh();
        $this->assertNotNull($fresh->delivered_at);
        $this->assertEquals('paid', $fresh->payment_status); // COD settled on delivery
    }

    public function test_partner_cannot_act_on_an_order_not_assigned_to_them(): void
    {
        [, , $order] = $this->readyOrder();
        $order->update(['delivery_partner_id' => $this->rider()->id, 'status' => OrderStatus::OutForDelivery->value]);

        Sanctum::actingAs($this->rider()); // a different rider
        $this->postJson("/api/v1/delivery/orders/{$order->id}/deliver")->assertStatus(403);
    }

    public function test_partner_can_release_before_pickup(): void
    {
        [, , $order] = $this->readyOrder();
        $rider = $this->rider();
        $order->update(['delivery_partner_id' => $rider->id, 'assigned_at' => now()]);
        Sanctum::actingAs($rider);

        $this->postJson("/api/v1/delivery/orders/{$order->id}/release")->assertOk();
        $this->assertNull($order->fresh()->delivery_partner_id);
    }

    public function test_non_delivery_user_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));
        $this->getJson('/api/v1/delivery/available')->assertStatus(403);
    }
}
