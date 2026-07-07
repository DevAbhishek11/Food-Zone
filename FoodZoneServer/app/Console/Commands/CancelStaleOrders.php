<?php

namespace App\Console\Commands;

use App\Contracts\PaymentGateway;
use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\NotificationService;
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

    public function handle(NotificationService $notifications, PaymentGateway $gateway): int
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

        foreach ($stale as $order) {
            DB::transaction(function () use ($order, $notifications, $gateway, $window) {
                $wasPaid = $order->payment_status === 'paid';

                $order->update([
                    'status' => OrderStatus::Cancelled->value,
                    'cancellation_reason' => "Not accepted within {$window} minutes.",
                    'cancelled_at' => now(),
                    'payment_status' => $wasPaid ? 'refunded' : $order->payment_status,
                ]);

                // Refund a captured online payment (best-effort, mirrors user cancel).
                if ($wasPaid) {
                    $payment = $order->payments()->where('status', 'paid')->latest()->first();
                    if ($payment) {
                        try {
                            $gateway->refund($payment);
                        } catch (\Throwable $e) {
                            Log::warning('Refund call failed on auto-cancel', ['order' => $order->id, 'error' => $e->getMessage()]);
                        }
                        $payment->update(['status' => 'refunded']);
                    }
                }

                $order->statusHistory()->create([
                    'status' => OrderStatus::Cancelled->value,
                    'changed_by' => null,
                    'note' => "Auto-cancelled: not accepted within {$window} minutes.",
                ]);

                $notifications->notify($order->user_id, 'order_status', 'Order cancelled',
                    "Sorry — {$order->vendor->name} didn't accept order {$order->order_number} in time. "
                    .($wasPaid ? 'Your payment has been refunded.' : 'You have not been charged.'),
                    ['order_id' => $order->id]);
                $notifications->notify($order->vendor->user_id, 'order_status', 'Order auto-cancelled',
                    "Order {$order->order_number} expired unaccepted after {$window} minutes.",
                    ['order_id' => $order->id]);

                event(new OrderStatusUpdated($order->id, $order->user_id, OrderStatus::Cancelled->value, $order->order_number));
            });
        }

        $this->info("Cancelled {$stale->count()} stale order(s).");

        return self::SUCCESS;
    }
}
