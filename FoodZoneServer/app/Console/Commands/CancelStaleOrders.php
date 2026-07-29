<?php

namespace App\Console\Commands;

use App\Contracts\PaymentGateway;
use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\NotificationService;
use App\Services\WalletService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Auto-cancel orders the vendor never accepted (spec §6.4).
 * Runs every minute from the scheduler; paid orders are refunded.
 */
class CancelStaleOrders extends Command
{
    protected $signature = 'orders:cancel-stale';

    protected $description = 'Cancel pending orders older than the acceptance window and refund paid ones';

    public function handle(NotificationService $notifications, PaymentGateway $gateway, WalletService $wallet): int
    {
        $window = (int) config('orders.acceptance_window_minutes', 15);
        if ($window <= 0) {
            $this->info('Auto-cancellation disabled (window <= 0).');

            return self::SUCCESS;
        }

        $stale = Order::query()
            ->where('status', OrderStatus::Pending->value)
            ->where('created_at', '<', now()->subMinutes($window))
            ->with('vendor')
            ->get();

        $cancelled = 0;
        foreach ($stale as $order) {
            // Isolate each order: one bad row (missing vendor, a DB hiccup)
            // must not abort the whole run — the scheduler re-selects the
            // same stale orders every minute, so an uncaught exception here
            // would silently wedge auto-cancellation for every order after
            // the poisoned one, forever.
            try {
                DB::transaction(function () use ($order, $notifications, $gateway, $wallet, $window) {
                    $wasPaid = $order->payment_status === 'paid';
                    // Only flip payment_status to 'refunded' once money has
                    // actually moved — see OrderController::cancel for the
                    // same reasoning.
                    $refunded = false;

                    if ($wasPaid && $order->payment_method === 'wallet') {
                        $wallet->credit($order->user, $order->wallet_amount, 'order_refund', $order, "Auto-cancelled order {$order->order_number}");
                        $refunded = true;
                    } elseif ($wasPaid) {
                        $payment = $order->payments()->where('status', 'paid')->latest()->first();
                        if ($payment) {
                            try {
                                $refunded = $gateway->refund($payment);
                            } catch (\Throwable $e) {
                                Log::error('Refund call failed on auto-cancel', ['order' => $order->id, 'error' => $e->getMessage()]);
                            }
                            if ($refunded) {
                                $payment->update(['status' => 'refunded']);
                            }
                        } else {
                            Log::error('Auto-cancel: order marked paid but no captured payment found', ['order' => $order->id]);
                        }
                    }

                    $order->update([
                        'status' => OrderStatus::Cancelled->value,
                        'cancellation_reason' => "Not accepted within {$window} minutes.",
                        'cancelled_at' => now(),
                        'payment_status' => ($wasPaid && $refunded) ? 'refunded' : $order->payment_status,
                    ]);

                    $order->statusHistory()->create([
                        'status' => OrderStatus::Cancelled->value,
                        'changed_by' => null,
                        'note' => "Auto-cancelled: not accepted within {$window} minutes.",
                    ]);

                    $notifications->notify($order->user_id, 'order_status', 'Order cancelled',
                        "Sorry — {$order->vendor->name} didn't accept order {$order->order_number} in time. "
                        .($wasPaid && $refunded ? 'Your payment has been refunded.' : ($wasPaid ? 'Your refund is being processed.' : 'You have not been charged.')),
                        ['order_id' => $order->id]);
                    $notifications->notify($order->vendor->user_id, 'order_status', 'Order auto-cancelled',
                        "Order {$order->order_number} expired unaccepted after {$window} minutes.",
                        ['order_id' => $order->id]);

                    event(new OrderStatusUpdated($order->id, $order->user_id, OrderStatus::Cancelled->value, $order->order_number));
                });
                $cancelled++;
            } catch (\Throwable $e) {
                Log::error('Auto-cancel failed for order — will retry next run', ['order' => $order->id, 'error' => $e->getMessage()]);
            }
        }

        $this->info("Cancelled {$cancelled}/{$stale->count()} stale order(s).");

        return self::SUCCESS;
    }
}
