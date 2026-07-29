<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrderDisputeTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Order, 1: Payment} */
    private function paidOrder(float $total = 300): array
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-DISPUTE-'.uniqid(),
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Preparing->value,
            'subtotal' => $total,
            'total' => $total,
            'payment_method' => 'upi',
            'payment_status' => 'paid',
        ]);
        $payment = Payment::create([
            'order_id' => $order->id, 'user_id' => $customer->id, 'gateway' => 'mock',
            'amount' => $total, 'currency' => 'INR', 'status' => 'paid', 'intent_id' => 'pi_test',
        ]);

        return [$order, $payment];
    }

    public function test_admin_can_override_order_status_regardless_of_transition_rules(): void
    {
        $vendor = Vendor::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-OVERRIDE-1', 'user_id' => User::factory()->create()->id,
            'vendor_id' => $vendor->id, 'status' => OrderStatus::Pending->value,
            'subtotal' => 100, 'total' => 100, 'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        // Pending -> Delivered is not a normal allowed transition, but admins may override.
        $this->postJson("/api/v1/vendor/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertOk()
            ->assertJsonPath('data.status', 'delivered');
    }

    public function test_admin_can_refund_a_paid_order(): void
    {
        [$order, $payment] = $this->paidOrder();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'Customer received wrong item'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'refunded');

        $this->assertEquals('refunded', $payment->fresh()->status);
        $this->assertDatabaseHas('notifications', ['user_id' => $order->user_id, 'type' => 'order_status']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'order.refunded']);
    }

    public function test_admin_can_issue_a_partial_refund(): void
    {
        [$order] = $this->paidOrder(300);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'One item missing', 'amount' => 100])
            ->assertOk();

        $this->assertDatabaseHas('order_status_history', ['order_id' => $order->id]);
    }

    public function test_cannot_refund_an_unpaid_order(): void
    {
        $vendor = Vendor::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-UNPAID-1', 'user_id' => User::factory()->create()->id,
            'vendor_id' => $vendor->id, 'status' => OrderStatus::Pending->value,
            'subtotal' => 100, 'total' => 100, 'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'test'])
            ->assertStatus(422);
    }

    public function test_non_admin_cannot_refund(): void
    {
        [$order] = $this->paidOrder();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'test'])
            ->assertStatus(403);
    }

    public function test_reason_is_required(): void
    {
        [$order] = $this->paidOrder();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", [])->assertStatus(422);
    }
}
