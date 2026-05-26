<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    /**
     * Price the current cart without placing an order — used by the clients to
     * show an authoritative order summary (variant/add-on pricing, delivery,
     * and voucher discount) before checkout. An invalid voucher does not fail
     * the quote; it returns the base totals plus a `voucher_error`.
     */
    public function quote(Request $request, OrderService $orders): JsonResponse
    {
        $data = $request->validate([
            'vendor_id' => ['required', 'integer', 'exists:vendors,id'],
            'voucher_code' => ['nullable', 'string', 'max:40'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.addon_ids' => ['nullable', 'array'],
            'items.*.addon_ids.*' => ['integer'],
        ]);

        $quote = $orders->quote($request->user(), $data, strictVoucher: false);

        return ApiResponse::success([
            'subtotal' => $quote['subtotal'],
            'discount' => $quote['discount'],
            'delivery_charge' => $quote['delivery_charge'],
            'tax' => $quote['tax'],
            'total' => $quote['total'],
            'voucher' => $quote['voucher'] ? [
                'code' => $quote['voucher']->code,
                'description' => $quote['voucher']->description,
                'discount' => $quote['discount'],
            ] : null,
            'voucher_error' => $quote['voucher_error'],
            'lines' => array_map(fn ($l) => [
                'item_id' => $l['item_id'],
                'item_name' => $l['item_name'],
                'quantity' => $l['quantity'],
                'unit_price' => $l['unit_price'],
                'line_total' => $l['line_total'],
                'customizations' => $l['customizations'] ?? null,
            ], $quote['lines']),
        ], 'Quote calculated.');
    }
}
