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

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Vendor, 1: User, 2: Order} */
    private function onlineOrder(string $method = 'upi', string $paymentStatus = 'pending', float $total = 300): array
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-PAY-'.uniqid(),
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value,
            'subtotal' => $total,
            'total' => $total,
            'payment_method' => $method,
            'payment_status' => $paymentStatus,
        ]);

        return [$vendor, $customer, $order];
    }

    public function test_customer_can_create_payment_intent_for_online_order(): void
    {
        [, $customer, $order] = $this->onlineOrder();
        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/orders/{$order->id}/pay")
            ->assertCreated()
            ->assertJsonPath('data.gateway', 'mock')
            ->assertJsonPath('data.amount', 300)
            ->assertJsonStructure(['data' => ['payment_id', 'intent_id', 'currency', 'key']]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'gateway' => 'mock',
            'status' => 'created',
        ]);
    }

    public function test_cannot_pay_a_cod_order(): void
    {
        [, $customer, $order] = $this->onlineOrder('cod');
        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/orders/{$order->id}/pay")->assertStatus(422);
    }

    public function test_cannot_pay_another_users_order(): void
    {
        [, , $order] = $this->onlineOrder();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/orders/{$order->id}/pay")->assertStatus(403);
    }

    public function test_confirm_marks_order_paid_and_notifies_vendor(): void
    {
        [$vendor, $customer, $order] = $this->onlineOrder();
        Sanctum::actingAs($customer);

        $paymentId = $this->postJson("/api/v1/orders/{$order->id}/pay")->json('data.payment_id');

        $this->postJson("/api/v1/payments/{$paymentId}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertDatabaseHas('notifications', ['user_id' => $vendor->user_id, 'type' => 'order_paid']);
    }

    public function test_webhook_confirms_payment_with_a_valid_signature(): void
    {
        [, $customer, $order] = $this->onlineOrder();
        Sanctum::actingAs($customer);
        $intentId = $this->postJson("/api/v1/orders/{$order->id}/pay")->json('data.intent_id');

        $payload = ['intent_id' => $intentId, 'reference' => 'mock_pay_webhook'];
        $raw = json_encode($payload);
        $signature = hash_hmac('sha256', $raw, (string) config('payments.webhook_secret'));

        $this->call('POST', '/api/v1/payments/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SIGNATURE' => $signature,
        ], $raw)->assertOk();

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertDatabaseHas('payments', ['intent_id' => $intentId, 'status' => 'paid', 'reference' => 'mock_pay_webhook']);
    }

    public function test_webhook_rejects_an_invalid_signature(): void
    {
        [, $customer, $order] = $this->onlineOrder();
        Sanctum::actingAs($customer);
        $intentId = $this->postJson("/api/v1/orders/{$order->id}/pay")->json('data.intent_id');

        $raw = json_encode(['intent_id' => $intentId]);

        $this->call('POST', '/api/v1/payments/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SIGNATURE' => 'deadbeef',
        ], $raw)->assertStatus(401);

        $this->assertEquals('pending', $order->fresh()->payment_status);
    }

    public function test_cancelling_a_paid_order_refunds_the_payment(): void
    {
        [, $customer, $order] = $this->onlineOrder('upi', 'paid');
        // A captured payment exists for this order.
        $payment = Payment::create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'gateway' => 'mock',
            'amount' => $order->total,
            'currency' => 'INR',
            'status' => 'paid',
            'intent_id' => 'mock_int_paid',
            'reference' => 'mock_pay_paid',
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertEquals('refunded', $order->fresh()->payment_status);
        $this->assertEquals('refunded', $payment->fresh()->status);
    }
}
