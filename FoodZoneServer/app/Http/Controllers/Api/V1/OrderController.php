<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\UserAddress;
use App\Services\NotificationService;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    /** Place a new order. */
    public function store(StoreOrderRequest $request, OrderService $orders): JsonResponse
    {
        $order = $orders->place($request->user(), $request->validated());

        return ApiResponse::success(
            new OrderResource($order->load(['items', 'vendor'])),
            'Order placed successfully.',
            201
        );
    }

    /** The current customer's order history. */
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['vendor', 'items', 'rating'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($orders, OrderResource::class, 'Orders loaded.');
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->assertCanView($request, $order);

        return ApiResponse::success(
            new OrderResource($order->load(['items', 'vendor', 'rating', 'statusHistory'])),
            'Order retrieved.'
        );
    }

    /** Orders received by the authenticated vendor. */
    public function vendorIndex(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;
        if (! $vendor) {
            return ApiResponse::error('You do not have a vendor account.', 403);
        }

        $orders = $vendor->orders()
            ->with(['items', 'user'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($orders, OrderResource::class, 'Vendor orders loaded.');
    }

    /** Vendor (owner) or admin advances the order through its lifecycle. */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $this->assertCanManage($request, $order);

        $data = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $next = OrderStatus::from($data['status']);
        $current = $order->status;

        // Admins may override; vendors must follow allowed transitions.
        if (! $request->user()->isAdmin() && ! $current->canTransitionTo($next)) {
            return ApiResponse::error(
                "Cannot move order from {$current->value} to {$next->value}.",
                422
            );
        }

        $this->applyStatus($order, $next, $request->user()->id, $data['note'] ?? null);

        $this->notifications->notify(
            $order->user_id,
            'order_status',
            'Order update',
            "Your order {$order->order_number} is now {$next->value}.",
            ['order_id' => $order->id, 'status' => $next->value],
        );

        return ApiResponse::success(
            new OrderResource($order->fresh()->load(['items', 'vendor', 'statusHistory'])),
            'Order status updated.'
        );
    }

    /** Customer cancels an order that the vendor has not yet accepted. */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You can only cancel your own orders.');
        }

        if ($order->status !== OrderStatus::Pending) {
            return ApiResponse::error('Only pending orders can be cancelled.', 422);
        }

        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:255']])['reason'] ?? 'Cancelled by customer.';

        $order->update([
            'status' => OrderStatus::Cancelled->value,
            'cancellation_reason' => $reason,
            'cancelled_at' => now(),
            'payment_status' => $order->payment_status === 'paid' ? 'refunded' : $order->payment_status,
        ]);
        $order->statusHistory()->create([
            'status' => OrderStatus::Cancelled->value,
            'changed_by' => $request->user()->id,
            'note' => $reason,
        ]);

        $this->notifications->notify($order->vendor->user_id, 'order_status', 'Order cancelled',
            "Order {$order->order_number} was cancelled by the customer.", ['order_id' => $order->id]);

        return ApiResponse::success(new OrderResource($order->fresh()), 'Order cancelled.');
    }

    /** Re-place a past order, rebuilding from its still-available items at current prices. */
    public function reorder(Request $request, Order $order, OrderService $orders): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You can only reorder your own orders.');
        }

        $order->load('items');
        $itemIds = $order->items->pluck('item_id')->filter()->all();

        $availableIds = MenuItem::whereIn('id', $itemIds)
            ->where('vendor_id', $order->vendor_id)
            ->where('is_available', true)
            ->pluck('id')
            ->all();

        $items = $order->items
            ->filter(fn ($i) => in_array($i->item_id, $availableIds, true))
            ->map(fn ($i) => ['item_id' => $i->item_id, 'quantity' => $i->quantity])
            ->values()
            ->all();

        if (empty($items)) {
            throw ApiException::make('None of the items from this order are available anymore.', 422);
        }

        // Reuse the original address only if it still belongs to the user.
        $addressId = $order->address_id !== null
            && UserAddress::where('id', $order->address_id)->where('user_id', $request->user()->id)->exists()
                ? $order->address_id
                : null;

        $new = $orders->place($request->user(), [
            'vendor_id' => $order->vendor_id,
            'payment_method' => $order->payment_method,
            'address_id' => $addressId,
            'items' => $items,
        ]);

        return ApiResponse::success(
            new OrderResource($new->load(['items', 'vendor'])),
            'Reorder placed successfully.',
            201
        );
    }

    /** Customer rates a delivered order (once). */
    public function rate(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You can only rate your own orders.');
        }
        if ($order->status !== OrderStatus::Delivered) {
            return ApiResponse::error('You can only rate delivered orders.', 422);
        }
        if ($order->rating()->exists()) {
            return ApiResponse::error('You have already rated this order.', 422);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'review' => ['nullable', 'string', 'min:20', 'max:2000'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['string', 'max:2048'],
        ]);

        DB::transaction(function () use ($order, $request, $data) {
            $order->rating()->create([
                'user_id' => $request->user()->id,
                'vendor_id' => $order->vendor_id,
                'rating' => $data['rating'],
                'review' => $data['review'] ?? null,
                'images' => $data['images'] ?? null,
            ]);

            // Recompute vendor aggregate rating.
            $vendor = $order->vendor;
            $agg = $vendor->ratings()->selectRaw('AVG(rating) avg, COUNT(*) cnt')->first();
            $vendor->update([
                'rating_avg' => round((float) $agg->avg, 2),
                'rating_count' => (int) $agg->cnt,
            ]);
        });

        return ApiResponse::success(null, 'Thanks for rating your order.', 201);
    }

    // ----------------------------------------------------------------

    private function applyStatus(Order $order, OrderStatus $next, int $userId, ?string $note): void
    {
        $attributes = ['status' => $next->value];
        if ($next === OrderStatus::Accepted) {
            $attributes['accepted_at'] = now();
        }
        if ($next === OrderStatus::Delivered) {
            $attributes['delivered_at'] = now();
            if ($order->payment_method === 'cod') {
                $attributes['payment_status'] = 'paid';
            }
        }
        if (in_array($next, [OrderStatus::Cancelled, OrderStatus::Rejected], true)) {
            $attributes['cancelled_at'] = now();
        }

        $order->update($attributes);
        $order->statusHistory()->create([
            'status' => $next->value,
            'changed_by' => $userId,
            'note' => $note,
        ]);
    }

    private function assertCanView(Request $request, Order $order): void
    {
        $user = $request->user();
        $isOwnerCustomer = $order->user_id === $user->id;
        $isOwnerVendor = $user->vendor && $order->vendor_id === $user->vendor->id;

        if (! $isOwnerCustomer && ! $isOwnerVendor && ! $user->isAdmin()) {
            abort(403, 'You are not allowed to view this order.');
        }
    }

    private function assertCanManage(Request $request, Order $order): void
    {
        $user = $request->user();
        $isOwnerVendor = $user->vendor && $order->vendor_id === $user->vendor->id;

        if (! $isOwnerVendor && ! $user->isAdmin()) {
            abort(403, 'Only the vendor or an admin can update this order.');
        }
    }
}
