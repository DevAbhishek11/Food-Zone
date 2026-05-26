<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\PaymentGateway;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentGateway $gateway,
        private NotificationService $notifications,
    ) {}

    /** Create a payment intent for an online (non-COD) order the customer owns. */
    public function pay(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You can only pay for your own orders.');
        }
        if ($order->payment_method === 'cod') {
            return ApiResponse::error('Cash-on-delivery orders are paid on delivery.', 422);
        }
        if ($order->payment_status === 'paid') {
            return ApiResponse::error('This order has already been paid.', 422);
        }
        if (in_array($order->status, [OrderStatus::Cancelled, OrderStatus::Rejected], true)) {
            return ApiResponse::error('This order can no longer be paid.', 422);
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'gateway' => $this->gateway->name(),
            'amount' => $order->total,
            'currency' => config('payments.currency', 'INR'),
            'status' => 'created',
        ]);

        $intent = $this->gateway->createIntent($payment);

        return ApiResponse::success(
            array_merge(['payment_id' => $payment->id, 'gateway' => $this->gateway->name()], $intent),
            'Payment intent created.',
            201,
        );
    }

    /**
     * Development/sandbox helper: confirm a payment without a real gateway
     * callback. Only available when the mock gateway is active.
     */
    public function confirm(Request $request, Payment $payment): JsonResponse
    {
        if ($payment->user_id !== $request->user()->id) {
            abort(403, 'You can only confirm your own payments.');
        }
        if ($this->gateway->name() !== 'mock') {
            return ApiResponse::error('Manual confirmation is only available with the mock gateway; real gateways confirm via webhook.', 422);
        }

        $this->markPaid($payment, 'mock_pay_'.Str::random(18));

        return ApiResponse::success(new PaymentResource($payment->fresh()), 'Payment confirmed.');
    }

    /**
     * Public gateway webhook. Verifies the signature for the active gateway,
     * then marks the matching payment (and its order) paid. Idempotent.
     */
    public function webhook(Request $request): JsonResponse
    {
        $raw = $request->getContent();
        $signature = $request->header((string) config('payments.signature_header', 'X-Signature'));

        if (! $this->gateway->verifyWebhook($raw, $signature)) {
            return ApiResponse::error('Invalid webhook signature.', 401);
        }

        $event = $request->all();

        // Accept a generic shape plus best-effort mapping for Razorpay/Stripe events.
        $intentId = data_get($event, 'intent_id')
            ?? data_get($event, 'payload.payment.entity.order_id')
            ?? data_get($event, 'data.object.id');

        $reference = data_get($event, 'reference')
            ?? data_get($event, 'payload.payment.entity.id')
            ?? data_get($event, 'data.object.payment_intent');

        $payment = $intentId ? Payment::where('intent_id', $intentId)->first() : null;
        if (! $payment) {
            return ApiResponse::error('No payment matches this event.', 404);
        }

        $this->markPaid($payment, $reference ? (string) $reference : null);

        return ApiResponse::success(null, 'Webhook processed.');
    }

    // ----------------------------------------------------------------

    private function markPaid(Payment $payment, ?string $reference): void
    {
        if ($payment->status === 'paid') {
            return; // idempotent — duplicate webhook deliveries are common
        }

        $payment->update(['status' => 'paid', 'reference' => $reference]);

        $order = $payment->order;
        if ($order && $order->payment_status !== 'paid') {
            $order->update(['payment_status' => 'paid']);

            $this->notifications->notify(
                $order->vendor->user_id,
                'order_paid',
                'Payment received',
                "Order {$order->order_number} has been paid (".number_format((float) $order->total, 2).').',
                ['order_id' => $order->id],
            );
        }
    }
}
