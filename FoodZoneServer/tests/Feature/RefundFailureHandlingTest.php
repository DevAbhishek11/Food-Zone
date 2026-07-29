<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A gateway refund can fail (return false) or throw. Either way, the order
 * must NOT be marked payment_status=refunded unless money actually moved —
 * see OrderController::cancel, AdminController::refundOrder and
 * CancelStaleOrders for the shared reasoning.
 */
class RefundFailureHandlingTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Order, 1: Payment} */
    private function paidOrder(string $status = 'pending'): array
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-RF-'.uniqid(),
            'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => $status, 'subtotal' => 200, 'total' => 200,
            'payment_method' => 'upi', 'payment_status' => 'paid',
        ]);
        $payment = Payment::create([
            'order_id' => $order->id, 'user_id' => $customer->id, 'gateway' => 'mock',
            'amount' => 200, 'currency' => 'INR', 'status' => 'paid', 'intent_id' => 'pi_rf',
        ]);

        return [$order, $payment];
    }

    private function bindFailingGateway(bool $throw): void
    {
        $fake = new class($throw) implements PaymentGateway
        {
            public function __construct(private bool $throw) {}

            public function name(): string
            {
                return 'mock';
            }

            public function createIntent(Payment $payment): array
            {
                return [];
            }

            public function verifyWebhook(string $rawPayload, ?string $signature): bool
            {
                return true;
            }

            public function refund(Payment $payment, ?float $amount = null): bool
            {
                if ($this->throw) {
                    throw new \RuntimeException('Gateway unreachable');
                }

                return false;
            }
        };
        app()->instance(PaymentGateway::class, $fake);
    }

    public function test_cancel_does_not_mark_refunded_when_gateway_returns_false(): void
    {
        [$order] = $this->paidOrder('pending');
        $this->bindFailingGateway(throw: false);
        Sanctum::actingAs($order->user);

        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertOk();

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Cancelled, $fresh->status);
        $this->assertEquals('paid', $fresh->payment_status); // NOT 'refunded' — gateway rejected it
    }

    public function test_cancel_does_not_mark_refunded_when_gateway_throws(): void
    {
        [$order] = $this->paidOrder('pending');
        $this->bindFailingGateway(throw: true);
        Sanctum::actingAs($order->user);

        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertOk();

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Cancelled, $fresh->status);
        $this->assertEquals('paid', $fresh->payment_status);
    }

    public function test_cancel_marks_refunded_when_gateway_succeeds(): void
    {
        [$order] = $this->paidOrder('pending'); // default mock gateway returns true
        Sanctum::actingAs($order->user);

        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertOk();

        $this->assertEquals('refunded', $order->fresh()->payment_status);
    }

    public function test_admin_refund_returns_502_and_does_not_mark_refunded_when_gateway_throws(): void
    {
        [$order] = $this->paidOrder('preparing');
        $this->bindFailingGateway(throw: true);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'test'])
            ->assertStatus(502);

        $this->assertEquals('paid', $order->fresh()->payment_status);
    }

    public function test_auto_cancel_does_not_mark_refunded_when_gateway_fails_but_still_cancels(): void
    {
        [$order] = $this->paidOrder('pending');
        $order->forceFill(['created_at' => now()->subMinutes(30)])->save();
        $this->bindFailingGateway(throw: false);
        config(['orders.acceptance_window_minutes' => 15]);

        $this->artisan('orders:cancel-stale')->assertSuccessful();

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Cancelled, $fresh->status);
        $this->assertEquals('paid', $fresh->payment_status);
    }

    public function test_auto_cancel_isolates_one_failing_order_from_the_rest(): void
    {
        // An order with a payment_status of 'paid' but no Payment row at all
        // is the scenario that used to log an error and (before this fix)
        // could throw depending on downstream code — it must not stop the
        // command from cancelling the next stale order in the batch.
        $vendor = Vendor::factory()->create();
        $poisoned = Order::create([
            'order_number' => 'FZ-POISON-1', 'user_id' => User::factory()->create()->id,
            'vendor_id' => $vendor->id, 'status' => 'pending',
            'subtotal' => 100, 'total' => 100, 'payment_method' => 'upi', 'payment_status' => 'paid',
        ]);
        $poisoned->forceFill(['created_at' => now()->subMinutes(30)])->save();

        $healthy = Order::create([
            'order_number' => 'FZ-HEALTHY-1', 'user_id' => User::factory()->create()->id,
            'vendor_id' => $vendor->id, 'status' => 'pending',
            'subtotal' => 100, 'total' => 100, 'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);
        $healthy->forceFill(['created_at' => now()->subMinutes(30)])->save();

        config(['orders.acceptance_window_minutes' => 15]);
        $this->artisan('orders:cancel-stale')->assertSuccessful();

        $this->assertEquals(OrderStatus::Cancelled, $poisoned->fresh()->status);
        $this->assertEquals(OrderStatus::Cancelled, $healthy->fresh()->status);
    }
}
