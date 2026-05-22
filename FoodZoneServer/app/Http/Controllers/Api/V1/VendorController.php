<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
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
use Illuminate\Support\Carbon;
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
            ->when($request->boolean('favorites') && $request->user(), fn ($q) => $q->whereHas(
                'favorites', fn ($f) => $f->where('user_id', $request->user()->id)
            ))
            ->tap(fn ($q) => $this->withFavoriteFlag($q, $request))
            ->orderByDesc('is_featured')
            ->orderByDesc('rating_avg')
            ->paginate(15);

        return ApiResponse::paginated($vendors, VendorResource::class, 'Vendors loaded.');
    }

    public function show(Request $request, string $idOrSlug): JsonResponse
    {
        $vendor = $this->resolveVendor($idOrSlug, $request);

        return ApiResponse::success(new VendorResource($vendor), 'Vendor retrieved.');
    }

    /** Full menu grouped by category (only available items shown to the public). */
    public function menu(Request $request, string $idOrSlug): JsonResponse
    {
        $vendor = $this->resolveVendor($idOrSlug, $request);

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

    /** Operational metrics for the vendor dashboard. */
    public function stats(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $today = now()->startOfDay();

        $orders = $vendor->orders();
        $deliveredToday = (clone $orders)
            ->where('status', \App\Enums\OrderStatus::Delivered->value)
            ->where('delivered_at', '>=', $today);

        return ApiResponse::success([
            'is_open' => (bool) $vendor->is_open,
            'pending_orders' => (clone $orders)->where('status', \App\Enums\OrderStatus::Pending->value)->count(),
            'active_orders' => (clone $orders)->whereIn('status', [
                \App\Enums\OrderStatus::Accepted->value,
                \App\Enums\OrderStatus::Preparing->value,
                \App\Enums\OrderStatus::Ready->value,
                \App\Enums\OrderStatus::OutForDelivery->value,
            ])->count(),
            'orders_today' => (clone $orders)->where('created_at', '>=', $today)->count(),
            'revenue_today' => round((float) (clone $deliveredToday)->sum('total'), 2),
            'total_orders' => (int) $vendor->orders_count,
            'rating_avg' => (float) $vendor->rating_avg,
            'rating_count' => (int) $vendor->rating_count,
            'menu_items' => $vendor->items()->count(),
        ], 'Vendor stats.');
    }

    /** Sales analytics for the vendor dashboard charts. */
    public function analytics(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $days = min(max((int) $request->query('days', 14), 1), 90);
        $from = now()->subDays($days - 1)->startOfDay();
        $delivered = OrderStatus::Delivered->value;

        $ordersByDay = $vendor->orders()->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')->groupBy('d')->pluck('c', 'd');
        $revenueByDay = $vendor->orders()->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d')
            ->selectRaw("SUM(CASE WHEN status = '{$delivered}' THEN total ELSE 0 END) as r")
            ->groupBy('d')->pluck('r', 'd');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::parse($from)->addDays($i)->toDateString();
            $series[] = [
                'date' => $date,
                'orders' => (int) ($ordersByDay[$date] ?? 0),
                'revenue' => round((float) ($revenueByDay[$date] ?? 0), 2),
            ];
        }

        $statusDistribution = $vendor->orders()->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count]);

        $topItems = $vendor->items()->orderByDesc('orders_count')->limit(5)->get()
            ->map(fn ($it) => [
                'id' => $it->id, 'name' => $it->name,
                'orders_count' => (int) $it->orders_count, 'rating_avg' => (float) $it->rating_avg,
            ]);

        return ApiResponse::success([
            'range_days' => $days,
            'revenue_series' => $series,
            'status_distribution' => $statusDistribution,
            'top_items' => $topItems,
            'lifetime_revenue' => round((float) $vendor->orders()->where('status', $delivered)->sum('total'), 2),
        ], 'Vendor analytics.');
    }

    /** Operating hours for the 7 days of the week. */
    public function hours(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        return ApiResponse::success(
            $vendor->operatingHours()->orderBy('day_of_week')->get(),
            'Operating hours.'
        );
    }

    /** Upsert operating hours (full week or a subset of days). */
    public function updateHours(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $data = $request->validate([
            'hours' => ['required', 'array', 'min:1', 'max:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'hours.*.is_closed' => ['boolean'],
            'hours.*.open_time' => ['nullable', 'date_format:H:i'],
            'hours.*.close_time' => ['nullable', 'date_format:H:i'],
        ]);

        foreach ($data['hours'] as $row) {
            $vendor->operatingHours()->updateOrCreate(
                ['day_of_week' => $row['day_of_week']],
                [
                    'is_closed' => $row['is_closed'] ?? false,
                    'open_time' => $row['is_closed'] ?? false ? null : ($row['open_time'] ?? null),
                    'close_time' => $row['is_closed'] ?? false ? null : ($row['close_time'] ?? null),
                ],
            );
        }

        return ApiResponse::success(
            $vendor->operatingHours()->orderBy('day_of_week')->get(),
            'Operating hours updated.'
        );
    }

    /** Add/remove a vendor from the current user's favorites. */
    public function favorite(Request $request, Vendor $vendor): JsonResponse
    {
        $request->user()->favorites()->firstOrCreate(['vendor_id' => $vendor->id]);

        return ApiResponse::success(['is_favorited' => true], 'Added to favorites.');
    }

    public function unfavorite(Request $request, Vendor $vendor): JsonResponse
    {
        $request->user()->favorites()->where('vendor_id', $vendor->id)->delete();

        return ApiResponse::success(['is_favorited' => false], 'Removed from favorites.');
    }

    /** The current user's favorited (approved) vendors. */
    public function favorites(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->whereHas('favorites', fn ($f) => $f->where('user_id', $request->user()->id))
            ->tap(fn ($q) => $this->withFavoriteFlag($q, $request))
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($vendors, VendorResource::class, 'Favorites loaded.');
    }

    // ----------------------------------------------------------------

    private function resolveVendor(string $idOrSlug, ?Request $request = null): Vendor
    {
        return Vendor::where('status', VendorStatus::Approved->value)
            ->where(fn ($q) => $q->where('slug', $idOrSlug)->orWhere('id', (int) $idOrSlug))
            ->tap(fn ($q) => $this->withFavoriteFlag($q, $request))
            ->firstOrFail();
    }

    /** Annotate a vendor query with `is_favorited` for the current user. */
    private function withFavoriteFlag($query, ?Request $request): void
    {
        $userId = $request?->user()?->id;
        if ($userId) {
            $query->withExists(['favorites as is_favorited' => fn ($f) => $f->where('user_id', $userId)]);
        }
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
