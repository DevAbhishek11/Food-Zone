<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Razorpay via its REST API (no SDK dependency). Amounts are sent in the
 * smallest currency unit (paise). Webhooks are HMAC-SHA256 signed with the
 * dashboard webhook secret in the `X-Razorpay-Signature` header.
 *
 * @see https://razorpay.com/docs/api/orders/
 */
class RazorpayPaymentGateway implements PaymentGateway
{
    private const BASE = 'https://api.razorpay.com/v1';

    public function name(): string
    {
        return 'razorpay';
    }

    public function createIntent(Payment $payment): array
    {
        $response = $this->client()->post(self::BASE.'/orders', [
            'amount' => (int) round($payment->amount * 100),
            'currency' => $payment->currency,
            'receipt' => 'order_'.$payment->order_id,
            'notes' => ['payment_id' => (string) $payment->id],
        ])->throw()->json();

        $payment->update(['intent_id' => $response['id']]);

        return [
            'intent_id' => $response['id'],
            'amount' => $response['amount'],   // paise
            'currency' => $response['currency'],
            'key' => config('payments.razorpay.key'),
        ];
    }

    public function verifyWebhook(string $rawPayload, ?string $signature): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $rawPayload, (string) config('payments.razorpay.webhook_secret'));

        return hash_equals($expected, $signature);
    }

    public function refund(Payment $payment, ?float $amount = null): bool
    {
        if (! $payment->reference) {
            return false;
        }

        $body = $amount !== null ? ['amount' => (int) round($amount * 100)] : [];

        $response = $this->client()->post(self::BASE."/payments/{$payment->reference}/refund", $body);

        if ($response->failed()) {
            Log::warning('Razorpay refund failed', ['payment' => $payment->id, 'body' => $response->body()]);
        }

        return $response->successful();
    }

    private function client()
    {
        return Http::withBasicAuth(
            (string) config('payments.razorpay.key'),
            (string) config('payments.razorpay.secret'),
        )->acceptJson();
    }
}
