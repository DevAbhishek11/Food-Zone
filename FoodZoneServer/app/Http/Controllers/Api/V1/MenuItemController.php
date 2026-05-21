<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesOwnedVendor;
use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    use ResolvesOwnedVendor;

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $items = $vendor->items()->with(['variants', 'addons', 'images'])->latest()->paginate(20);

        return ApiResponse::paginated($items, MenuItemResource::class, 'Menu items loaded.');
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $this->validateItem($request, $vendor->id);

        $item = DB::transaction(function () use ($vendor, $data) {
            $item = $vendor->items()->create([
                'category_id' => $data['category_id'] ?? null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'dietary_tags' => $data['dietary_tags'] ?? null,
                'allergens' => $data['allergens'] ?? null,
                'is_available' => $data['is_available'] ?? true,
                'prep_time_minutes' => $data['prep_time_minutes'] ?? null,
            ]);

            $this->syncChildren($item, $data);

            return $item;
        });

        return ApiResponse::success(
            new MenuItemResource($item->load(['variants', 'addons', 'images'])),
            'Menu item created.',
            201
        );
    }

    public function update(Request $request, MenuItem $item): JsonResponse
    {
        $this->assertOwns($request, $item);
        $data = $this->validateItem($request, $item->vendor_id, partial: true);

        DB::transaction(function () use ($item, $data, $request) {
            $item->update(array_filter(
                $request->only(['category_id', 'name', 'description', 'price', 'dietary_tags', 'allergens', 'is_available', 'prep_time_minutes']),
                fn ($v) => $v !== null
            ));

            // Replace variants/addons only when explicitly provided.
            if ($request->has('variants') || $request->has('addons') || $request->has('images')) {
                if ($request->has('variants')) {
                    $item->variants()->delete();
                }
                if ($request->has('addons')) {
                    $item->addons()->delete();
                }
                if ($request->has('images')) {
                    $item->images()->delete();
                }
                $this->syncChildren($item, $data);
            }
        });

        return ApiResponse::success(
            new MenuItemResource($item->fresh()->load(['variants', 'addons', 'images'])),
            'Menu item updated.'
        );
    }

    public function destroy(Request $request, MenuItem $item): JsonResponse
    {
        $this->assertOwns($request, $item);
        $item->delete();

        return ApiResponse::success(null, 'Menu item deleted.');
    }

    public function toggleAvailability(Request $request, MenuItem $item): JsonResponse
    {
        $this->assertOwns($request, $item);
        $item->update(['is_available' => ! $item->is_available]);

        return ApiResponse::success(
            ['is_available' => $item->is_available],
            $item->is_available ? 'Item is now available.' : 'Item marked unavailable.'
        );
    }

    // ----------------------------------------------------------------

    private function validateItem(Request $request, int $vendorId, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'category_id' => ['nullable', Rule::exists('menu_categories', 'id')->where('vendor_id', $vendorId)],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => [$required, 'numeric', 'min:0'],
            'dietary_tags' => ['nullable', 'array'],
            'allergens' => ['nullable', 'array'],
            'is_available' => ['sometimes', 'boolean'],
            'prep_time_minutes' => ['nullable', 'integer', 'min:0', 'max:300'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required_with:variants', 'string', 'max:100'],
            'variants.*.price_modifier' => ['nullable', 'numeric'],
            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:100'],
            'addons.*.price' => ['nullable', 'numeric', 'min:0'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['string', 'max:2048'],
        ]);
    }

    private function syncChildren(MenuItem $item, array $data): void
    {
        foreach ($data['variants'] ?? [] as $v) {
            $item->variants()->create([
                'name' => $v['name'],
                'price_modifier' => $v['price_modifier'] ?? 0,
                'is_default' => $v['is_default'] ?? false,
            ]);
        }
        foreach ($data['addons'] ?? [] as $a) {
            $item->addons()->create([
                'name' => $a['name'],
                'price' => $a['price'] ?? 0,
            ]);
        }
        foreach ($data['images'] ?? [] as $i => $url) {
            $item->images()->create(['url' => $url, 'sort_order' => $i]);
        }
    }

    private function assertOwns(Request $request, MenuItem $item): void
    {
        if ($item->vendor_id !== $this->ownedVendor($request)->id) {
            abort(403, 'This item does not belong to your store.');
        }
    }
}
