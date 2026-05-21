<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorController extends Controller
{
    /** Public, filterable list of approved vendors. */
    public function index(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->when($request->filled('city'), fn ($q) => $q->where('city', $request->string('city')))
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->string('q').'%'))
            ->when($request->boolean('open_now'), fn ($q) => $q->where('is_open', true))
            ->when($request->filled('min_rating'), fn ($q) => $q->where('rating_avg', '>=', (float) $request->input('min_rating')))
            ->orderByDesc('is_featured')
            ->orderByDesc('rating_avg')
            ->paginate(15);

        return ApiResponse::paginated($vendors, VendorResource::class, 'Vendors loaded.');
    }

    public function show(string $idOrSlug): JsonResponse
    {
        $vendor = $this->resolveVendor($idOrSlug);

        return ApiResponse::success(new VendorResource($vendor), 'Vendor retrieved.');
    }

    /** Full menu grouped by category (only available items shown to the public). */
    public function menu(string $idOrSlug): JsonResponse
    {
        $vendor = $this->resolveVendor($idOrSlug);

        $categories = $vendor->categories()
            ->where('status', 'approved')
            ->with(['items' => fn ($q) => $q->where('is_available', true)->with(['variants', 'addons', 'images'])])
            ->orderBy('sort_order')
            ->get();

        $uncategorized = $vendor->items()
            ->whereNull('category_id')->where('is_available', true)
            ->with(['variants', 'addons', 'images'])->get();

        return ApiResponse::success([
            'vendor' => new VendorResource($vendor),
            'categories' => MenuCategoryResource::collection($categories),
            'uncategorized' => MenuItemResource::collection($uncategorized),
        ], 'Menu retrieved.');
    }

    /** Authenticated user submits a vendor application (enters Pending). */
    public function register(Request $request): JsonResponse
    {
        $me = $request->user();

        if ($me->vendor()->exists()) {
            return ApiResponse::error('You have already submitted a vendor application.', 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'business_license' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        $data['user_id'] = $me->id;
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['status'] = VendorStatus::Pending->value;

        $vendor = Vendor::create($data);

        return ApiResponse::success(
            new VendorResource($vendor),
            'Vendor application submitted. It is now pending admin review.',
            201
        );
    }

    /** Vendor owner updates store profile / operational settings. */
    public function update(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo' => ['nullable', 'string', 'max:2048'],
            'banner' => ['nullable', 'string', 'max:2048'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'delivery_enabled' => ['sometimes', 'boolean'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'free_delivery_above' => ['nullable', 'numeric', 'min:0'],
            'prep_time_minutes' => ['nullable', 'integer', 'min:0', 'max:300'],
            'cod_enabled' => ['sometimes', 'boolean'],
        ]);

        $vendor->update($data);

        return ApiResponse::success(new VendorResource($vendor->fresh()), 'Store updated.');
    }

    public function toggleOpen(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $data = $request->validate([
            'is_open' => ['required', 'boolean'],
            'closed_message' => ['nullable', 'string', 'max:255'],
        ]);

        $vendor->update([
            'is_open' => $data['is_open'],
            'closed_message' => $data['is_open'] ? null : ($data['closed_message'] ?? 'Temporarily closed.'),
        ]);

        return ApiResponse::success(new VendorResource($vendor->fresh()),
            $data['is_open'] ? 'Store is now open.' : 'Store is now closed.');
    }

    /** The current vendor's own profile (any status). */
    public function mine(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return ApiResponse::error('You do not have a vendor account.', 404);
        }

        return ApiResponse::success(new VendorResource($vendor), 'Your vendor profile.');
    }

    // ----------------------------------------------------------------

    private function resolveVendor(string $idOrSlug): Vendor
    {
        return Vendor::where('status', VendorStatus::Approved->value)
            ->where(fn ($q) => $q->where('slug', $idOrSlug)->orWhere('id', (int) $idOrSlug))
            ->firstOrFail();
    }

    private function ownedVendor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            abort(403, 'You do not have a vendor account.');
        }

        return $vendor;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'vendor';
        $slug = $base;
        $i = 1;
        while (Vendor::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }
}
