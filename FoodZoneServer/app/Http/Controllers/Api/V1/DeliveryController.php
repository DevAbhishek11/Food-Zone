<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\UserResource;
use App\Models\Order;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DeliveryController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    /** Statuses at which an order needs (or already has) a delivery partner. */
    private const CLAIMABLE = [
        OrderStatus::Preparing->value,
        OrderStatus::Ready->value,
    ];

    /** Promote the current user to a delivery partner (idempotent). */
    public function register(Request $request): JsonResponse
    {
        $me = $request->user();

        if ($me->role === UserRole::Delivery) {
            return ApiResponse::success(new UserResource($me), 'You are already a delivery partner.');
        }
        if ($me->role !== UserRole::User) {
            return ApiResponse::error('Only standard accounts can become delivery partners.', 422);
        }

        $me->update(['role' => UserRole::Delivery->value]);

        return ApiResponse::success(new UserResource($me->fresh()), 'You are now a delivery partner.');
    }

    /** Unassigned orders that are being prepared / ready, for partners to claim. */
    public function available(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->whereNull('delivery_partner_id')
            ->whereIn('status', self::CLAIMABLE)
            ->whereHas('vendor', fn ($q) => $q->where('delivery_enabled', true))
            ->with(['vendor', 'items'])
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($orders, OrderResource::class, 'Available deliveries loaded.');
    }

    /** The partner's own deliveries (filter: active | completed). */
    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('delivery_partner_id', $request->user()->id)
            ->when($request->string('status')->toString() === 'active', fn ($q) => $q->whereIn('status', [
                OrderStatus::Preparing->value, OrderStatus::Ready->value, OrderStatus::OutForDelivery->value,
            ]))
            ->when($request->string('status')->toString() === 'completed', fn ($q) => $q->where('status', OrderStatus::Delivered->value))
            ->with(['vendor', 'items'])
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($orders, OrderResource::class, 'Your deliveries loaded.');
    }

    public function stats(Request $request): JsonResponse
    {
        $base = Order::where('delivery_partner_id', $request->user()->id);

        return ApiResponse::success([
            'active' => (clone $base)->whereIn('status', [
                OrderStatus::Preparing->value, OrderStatus::Ready->value, OrderStatus::OutForDelivery->value,
            ])->count(),
            'delivered_today' => (clone $base)->where('status', OrderStatus::Delivered->value)
                ->whereDate('delivered_at', Carbon::today())->count(),
            'total_delivered' => (clone $base)->where('status', OrderStatus::Delivered->value)->count(),
        ], 'Delivery stats loaded.');
    }

    /** Claim an available order. Atomic — only one partner can win. */
    public function accept(Request $request, Order $order): JsonResponse
    {
        $me = $request->user();

        $claimed = Order::where('id', $order->id)
            ->whereNull('delivery_partner_id')
            ->whereIn('status', self::CLAIMABLE)
            ->update(['delivery_partner_id' => $me->id, 'assigned_at' => now()]);

        if (! $claimed) {
            return ApiResponse::error('This order is no longer available.', 422);
        }

        $order->refresh();

        $this->notifications->notify($order->user_id, 'order_status', 'Delivery partner assigned',
            "{$me->name} will deliver your order {$order->order_number}.", ['order_id' => $order->id]);
        $this->notifications->notify($order->vendor->user_id, 'order_status', 'Delivery partner assigned',
            "{$me->name} will pick up order {$order->order_number}.", ['order_id' => $order->id]);

        return ApiResponse::success(
            new OrderResource($order->load(['vendor', 'items', 'deliveryPartner'])),
            'Delivery accepted.'
        );
    }

    /** Release a claimed order back to the pool (before pickup only). */
    public function release(Request $request, Order $order): JsonResponse
    {
        $this->assertAssigned($request, $order);

        if (in_array($order->status, [OrderStatus::OutForDelivery, OrderStatus::Delivered], true)) {
            return ApiResponse::error('You cannot release an order after pickup.', 422);
        }

        $order->update(['delivery_partner_id' => null, 'assigned_at' => null]);

        return ApiResponse::success(new OrderResource($order->fresh()->load(['vendor', 'items'])), 'Delivery released.');
    }

    /** Mark a ready order as picked up → out for delivery. */
    public function pickUp(Request $request, Order $order): JsonResponse
    {
        $this->assertAssigned($request, $order);

        if ($order->status !== OrderStatus::Ready) {
            return ApiResponse::error('This order is not ready for pickup yet.', 422);
        }

        $this->applyStatus($order, OrderStatus::OutForDelivery, $request->user()->id,
            'Picked up by delivery partner.', ['picked_up_at' => now()]);

        $this->notifications->notify($order->user_id, 'order_status', 'Order on the way',
            "Your order {$order->order_number} is out for delivery.", ['order_id' => $order->id]);

        return ApiResponse::success(
            new OrderResource($order->fresh()->load(['vendor', 'items', 'deliveryPartner', 'statusHistory'])),
            'Order picked up.'
        );
    }

    /** Mark an out-for-delivery order as delivered. */
    public function deliver(Request $request, Order $order): JsonResponse
    {
        $this->assertAssigned($request, $order);

        if ($order->status !== OrderStatus::OutForDelivery) {
            return ApiResponse::error('This order is not out for delivery.', 422);
        }

        $extra = ['delivered_at' => now()];
        if ($order->payment_method === 'cod') {
            $extra['payment_status'] = 'paid';
        }

        $this->applyStatus($order, OrderStatus::Delivered, $request->user()->id, 'Delivered to customer.', $extra);

        $this->notifications->notify($order->user_id, 'order_status', 'Order delivered',
            "Your order {$order->order_number} has been delivered. Enjoy!", ['order_id' => $order->id]);
        $this->notifications->notify($order->vendor->user_id, 'order_status', 'Order delivered',
            "Order {$order->order_number} was delivered.", ['order_id' => $order->id]);

        return ApiResponse::success(
            new OrderResource($order->fresh()->load(['vendor', 'items', 'deliveryPartner', 'statusHistory'])),
            'Order delivered.'
        );
    }

    // ----------------------------------------------------------------

    private function assertAssigned(Request $request, Order $order): void
    {
        if ($order->delivery_partner_id !== $request->user()->id) {
            abort(403, 'This delivery is not assigned to you.');
        }
    }

    /** @param  array<string,mixed>  $extra */
    private function applyStatus(Order $order, OrderStatus $next, int $userId, string $note, array $extra = []): void
    {
        $order->update(array_merge(['status' => $next->value], $extra));
        $order->statusHistory()->create([
            'status' => $next->value,
            'changed_by' => $userId,
            'note' => $note,
        ]);

        event(new OrderStatusUpdated($order->id, $order->user_id, $next->value, $order->order_number));
    }
}
