<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Illuminate\Support\Str;

/**
 * Local/test gateway. Generates fake intent ids and verifies webhooks with a
 * simple HMAC of the raw body and `payments.webhook_secret`, so the whole
 * intent → confirm → refund flow is exercisable without any external service.
 */
class MockPaymentGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'mock';
    }

    public function createIntent(Payment $payment): array
    {
        $intentId = 'mock_int_'.Str::random(24);
        $payment->update(['intent_id' => $intentId]);

        return [
            'intent_id' => $intentId,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'key' => config('payments.mock.key'),
        ];
    }

    public function verifyWebhook(string $rawPayload, ?string $signature): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $rawPayload, (string) config('payments.webhook_secret'));

        return hash_equals($expected, $signature);
    }

    public function refund(Payment $payment, ?float $amount = null): bool
    {
        return true;
    }
}
