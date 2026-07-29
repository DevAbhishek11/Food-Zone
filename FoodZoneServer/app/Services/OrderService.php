<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Exceptions\ApiException;
use App\Models\ItemAddon;
use App\Models\ItemVariant;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Vendor;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private NotificationService $notifications,
        private WalletService $wallet,
    ) {}

    /**
     * Price an order without persisting it. Returns vendor + resolved line
     * items + the full money breakdown (subtotal/discount/delivery/tax/total/
     * commission) + the applied voucher. Shared by {@see place()} and the
     * checkout-quote endpoint so previews match the real charge exactly.
     *
     * $payload keys: vendor_id, voucher_code?, items[] =
     *   {item_id, quantity, variant_id?, addon_ids?[]}.
     *
     * @param  bool  $strictVoucher  When true an invalid voucher throws; when
     *   false the error is returned in `voucher_error` and pricing continues
     *   without the discount (used for live cart previews).
     * @return array{vendor: Vendor, voucher: ?Voucher, voucher_error: ?string, lines: array<int,array<string,mixed>>, subtotal: float, discount: float, delivery_charge: float, tax: float, total: float, commission: float}
     *
     * @throws ApiException
     */
    public function quote(User $user, array $payload, bool $strictVoucher = true): array
    {
        /** @var Vendor $vendor */
        $vendor = Vendor::find($payload['vendor_id']);

        if (! $vendor) {
            throw ApiException::make('Vendor not found.', 404);
        }
        if (! $vendor->isApproved()) {
            throw ApiException::make('This vendor is not currently available.', 422);
        }
        if (! $vendor->is_open) {
            throw ApiException::make('This store is closed and not accepting orders right now.', 422);
        }

        // Resolve & validate items belonging to the vendor.
        $itemIds = collect($payload['items'])->pluck('item_id')->unique();
        $menuItems = MenuItem::whereIn('id', $itemIds)->where('vendor_id', $vendor->id)->get()->keyBy('id');

        if ($menuItems->count() !== $itemIds->count()) {
            throw ApiException::make('One or more items are invalid for this vendor.', 422);
        }

        $lines = [];
        $subtotal = 0.0;

        foreach ($payload['items'] as $line) {
            /** @var MenuItem $item */
            $item = $menuItems[$line['item_id']];

            if (! $item->is_available) {
                throw ApiException::make("\"{$item->name}\" is currently unavailable.", 422);
            }

            $quantity = (int) $line['quantity'];
            $unitPrice = (float) $item->price;
            $customizations = [];

            // Variant
            if (! empty($line['variant_id'])) {
                $variant = ItemVariant::where('id', $line['variant_id'])->where('item_id', $item->id)->first();
                if (! $variant) {
                    throw ApiException::make('Invalid variant for item '.$item->name.'.', 422);
                }
                $unitPrice += (float) $variant->price_modifier;
                $customizations['variant'] = ['id' => $variant->id, 'name' => $variant->name];
            }

            // Add-ons
            if (! empty($line['addon_ids'])) {
                $addons = ItemAddon::whereIn('id', $line['addon_ids'])
                    ->where('item_id', $item->id)->where('is_available', true)->get();
                if ($addons->count() !== count($line['addon_ids'])) {
                    throw ApiException::make('One or more add-ons are invalid for '.$item->name.'.', 422);
                }
                foreach ($addons as $addon) {
                    $unitPrice += (float) $addon->price;
                    $customizations['addons'][] = ['id' => $addon->id, 'name' => $addon->name, 'price' => (float) $addon->price];
                }
            }

            $lineTotal = round($unitPrice * $quantity, 2);
            $subtotal += $lineTotal;

            $lines[] = [
                'item_id' => $item->id,
                'item_name' => $item->name,
                'quantity' => $quantity,
                'unit_price' => round($unitPrice, 2),
                'line_total' => $lineTotal,
                'customizations' => $customizations ?: null,
            ];
        }

        $subtotal = round($subtotal, 2);

        if ($subtotal < (float) $vendor->min_order_value) {
            throw ApiException::make(
                'Minimum order value for this store is '.number_format((float) $vendor->min_order_value, 2).'.',
                422
            );
        }

        // Delivery charge
        $deliveryCharge = 0.0;
        if ($vendor->delivery_enabled) {
            $deliveryCharge = (float) $vendor->delivery_fee;
            if ($vendor->free_delivery_above !== null && $subtotal >= (float) $vendor->free_delivery_above) {
                $deliveryCharge = 0.0;
            }
        }

        // Voucher — strict when placing, lenient when previewing.
        $discount = 0.0;
        $voucher = null;
        $voucherError = null;
        if (! empty($payload['voucher_code'])) {
            $found = Voucher::where('code', $payload['voucher_code'])->first();
            if (! $found) {
                $voucherError = 'Invalid voucher code.';
            } elseif ($error = $found->validateFor($user, $subtotal, $vendor->id)) {
                $voucherError = $error;
            } else {
                $voucher = $found;
                $discount = $voucher->discountFor($subtotal);
            }

            if ($voucherError !== null && $strictVoucher) {
                throw ApiException::make($voucherError, 422);
            }
        }

        $tax = 0.0;
        $total = round($subtotal - $discount + $deliveryCharge + $tax, 2);
        $commission = round($subtotal * ((float) $vendor->commission_rate / 100), 2);

        return [
            'vendor' => $vendor,
            'voucher' => $voucher,
            'voucher_error' => $voucherError,
            'lines' => $lines,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_charge' => $deliveryCharge,
            'tax' => $tax,
            'total' => $total,
            'commission' => $commission,
        ];
    }

    /**
     * Place an order. $payload keys: vendor_id, address_id?, payment_method,
     * voucher_code?, notes?, items[] = {item_id, quantity, variant_id?, addon_ids?[]}.
     *
     * @throws ApiException
     */
    public function place(User $user, array $payload): Order
    {
        $quote = $this->quote($user, $payload);
        /** @var Vendor $vendor */
        $vendor = $quote['vendor'];
        $lines = $quote['lines'];
        $subtotal = $quote['subtotal'];
        $discount = $quote['discount'];
        $deliveryCharge = $quote['delivery_charge'];
        $tax = $quote['tax'];
        $total = $quote['total'];
        $commission = $quote['commission'];
        $voucher = $quote['voucher'];

        // Payment method validation
        $paymentMethod = $payload['payment_method'] ?? 'cod';
        if ($paymentMethod === 'cod' && ! $vendor->cod_enabled) {
            throw ApiException::make('This store does not accept cash on delivery.', 422);
        }
        // Wallet is a full-payment method (not a partial top-up) — fail fast
        // with a clear message rather than letting the order sit unpaid.
        if ($paymentMethod === 'wallet' && $this->wallet->balanceFor($user)->balance < $total) {
            throw ApiException::make('Insufficient wallet balance for this order.', 422);
        }

        // Delivery address snapshot
        $addressSnapshot = null;
        $addressId = $payload['address_id'] ?? null;
        if ($addressId) {
            $address = UserAddress::where('id', $addressId)->where('user_id', $user->id)->first();
            if (! $address) {
                throw ApiException::make('Selected address not found.', 422);
            }
            $addressSnapshot = $address->only(['label', 'address', 'city', 'state', 'pincode', 'landmark', 'lat', 'lng']);
        }

        return DB::transaction(function () use (
            $user, $vendor, $lines, $subtotal, $discount, $deliveryCharge, $tax,
            $total, $commission, $paymentMethod, $voucher, $payload, $addressId, $addressSnapshot
        ) {
            $payingWithWallet = $paymentMethod === 'wallet';

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user->id,
                'vendor_id' => $vendor->id,
                'address_id' => $addressId,
                'status' => OrderStatus::Pending->value,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'delivery_charge' => $deliveryCharge,
                'tax' => $tax,
                'total' => $total,
                'commission' => $commission,
                'wallet_amount' => $payingWithWallet ? $total : 0,
                'payment_method' => $paymentMethod,
                // Wallet debits synchronously below, so the order is paid the
                // instant it's placed — unlike online methods, which wait for
                // a gateway confirm/webhook.
                'payment_status' => $payingWithWallet ? 'paid' : 'pending',
                'voucher_id' => $voucher?->id,
                'notes' => $payload['notes'] ?? null,
                'delivery_address' => $addressSnapshot,
            ]);

            if ($payingWithWallet) {
                $this->wallet->debit($user, $total, 'order_payment', $order, "Order {$order->order_number}");
            }

            foreach ($lines as $line) {
                $order->items()->create($line);
                MenuItem::where('id', $line['item_id'])->increment('orders_count', $line['quantity']);
            }

            $order->statusHistory()->create([
                'status' => OrderStatus::Pending->value,
                'changed_by' => $user->id,
                'note' => 'Order placed.',
            ]);

            if ($voucher) {
                VoucherRedemption::create([
                    'voucher_id' => $voucher->id,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'discount_applied' => $discount,
                ]);
                $voucher->increment('used_count');
            }

            $vendor->increment('orders_count');

            $this->notifications->notify(
                $vendor->user_id,
                'order_placed',
                'New order received',
                "Order {$order->order_number} for ".number_format($total, 2).'.',
                ['order_id' => $order->id],
            );

            return $order;
        });
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'FZ-'.now()->format('ymd').'-'.strtoupper(Str::random(6));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
