<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stripe via its REST API (no SDK dependency). Amounts are in the smallest
 * currency unit (cents). Webhooks are verified per Stripe's scheme: the
 * `Stripe-Signature` header carries `t=<timestamp>,v1=<hmac>` and the signed
 * payload is `"{t}.{rawBody}"` HMAC-SHA256'd with the endpoint secret.
 *
 * @see https://stripe.com/docs/api/payment_intents
 * @see https://stripe.com/docs/webhooks/signatures
 */
class StripePaymentGateway implements PaymentGateway
{
    private const BASE = 'https://api.stripe.com/v1';

    public function name(): string
    {
        return 'stripe';
    }

    public function createIntent(Payment $payment): array
    {
        $response = $this->client()->asForm()->post(self::BASE.'/payment_intents', [
            'amount' => (int) round($payment->amount * 100),
            'currency' => strtolower($payment->currency),
            'metadata' => ['payment_id' => (string) $payment->id, 'order_id' => (string) $payment->order_id],
        ])->throw()->json();

        $payment->update(['intent_id' => $response['id']]);

        return [
            'intent_id' => $response['id'],
            'client_secret' => $response['client_secret'] ?? null,
            'amount' => $response['amount'],   // cents
            'currency' => strtoupper($response['currency']),
            'key' => config('payments.stripe.key'),
        ];
    }

    public function verifyWebhook(string $rawPayload, ?string $signature): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signature) as $segment) {
            [$key, $value] = array_pad(explode('=', $segment, 2), 2, null);
            $parts[trim((string) $key)] = $value;
        }

        $timestamp = $parts['t'] ?? null;
        $v1 = $parts['v1'] ?? null;
        if (! $timestamp || ! $v1) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$rawPayload, (string) config('payments.stripe.webhook_secret'));

        return hash_equals($expected, $v1);
    }

    public function refund(Payment $payment, ?float $amount = null): bool
    {
        if (! $payment->intent_id) {
            return false;
        }

        $body = ['payment_intent' => $payment->intent_id];
        if ($amount !== null) {
            $body['amount'] = (int) round($amount * 100);
        }

        $response = $this->client()->asForm()->post(self::BASE.'/refunds', $body);

        if ($response->failed()) {
            Log::warning('Stripe refund failed', ['payment' => $payment->id, 'body' => $response->body()]);
        }

        return $response->successful();
    }

    private function client()
    {
        return Http::withToken((string) config('payments.stripe.secret'))->acceptJson();
    }
}
