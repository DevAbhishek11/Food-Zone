<?php

namespace App\Contracts;

use App\Models\Payment;

/**
 * A payment gateway driver. Drivers are resolved by `config('payments.gateway')`
 * (see AppServiceProvider). The default `mock` driver lets the full
 * intent → confirm → refund flow run in development and tests without any
 * external service; `razorpay`/`stripe` talk to the real REST APIs over HTTP.
 */
interface PaymentGateway
{
    /** Machine name of the driver, e.g. 'mock', 'razorpay', 'stripe'. */
    public function name(): string;

    /**
     * Create a payment intent/order on the gateway for the given payment row,
     * persisting the returned `intent_id`. Returns the client-facing payload
     * (intent id, public key, amount in the gateway's unit, etc.).
     *
     * @return array<string,mixed>
     */
    public function createIntent(Payment $payment): array;

    /** Verify the authenticity of a raw webhook body against its signature header. */
    public function verifyWebhook(string $rawPayload, ?string $signature): bool;

    /** Issue a (full or partial) refund for a captured payment. */
    public function refund(Payment $payment, ?float $amount = null): bool;
}
