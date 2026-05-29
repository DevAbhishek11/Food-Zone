<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FlashDeal;
use App\Models\MenuItem;
use App\Models\Vendor;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class FlashDealsController extends Controller
{
    /** Active flash deals sorted by least time remaining (most urgent first). */
    public function index(): JsonResponse
    {
        $deals = FlashDeal::active()
            ->orderBy('ends_at')
            ->limit(50)
            ->get();

        $itemIds = $deals->pluck('item_id')->unique()->all();
        $vendorIds = $deals->pluck('vendor_id')->unique()->all();

        $items = MenuItem::whereIn('id', $itemIds)->get()->keyBy('id');
        $vendors = Vendor::whereIn('id', $vendorIds)->get()->keyBy('id');

        $payload = $deals->map(function (FlashDeal $deal) use ($items, $vendors) {
            $item = $items->get($deal->item_id);
            $vendor = $vendors->get($deal->vendor_id);
            if (! $item || ! $vendor) return null;

            $original = (float) $item->price;
            $discounted = round($original * (1 - $deal->discount_percent / 100), 2);

            return [
                'id' => $deal->id,
                'vendor' => [
                    'id' => $vendor->id,
                    'name' => $vendor->name,
                    'slug' => $vendor->slug,
                    'logo' => $vendor->logo,
                ],
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'image' => $item->images[0] ?? null,
                    'original_price' => $original,
                ],
                'discount_percent' => $deal->discount_percent,
                'deal_price' => $discounted,
                'ends_at' => $deal->ends_at?->toIso8601String(),
                'seconds_remaining' => max(0, $deal->ends_at?->diffInSeconds(now(), false) ? abs($deal->ends_at->diffInSeconds(now(), false)) : 0),
                'quantity_limit' => $deal->quantity_limit,
                'claimed_count' => $deal->claimed_count,
            ];
        })->filter()->values();

        return ApiResponse::success($payload, 'Active flash deals.');
    }
}
