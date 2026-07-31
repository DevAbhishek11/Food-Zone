<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\VendorResource;
use App\Models\FlashDeal;
use App\Models\InventoryItem;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorUserBlock;
use App\Models\Voucher;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorController extends Controller
{
    /** Vendors sorted by distance from the given (lat,lng) — Haversine in PHP for portability. */
    public function nearby(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'numeric', 'min:0.5', 'max:50'],
        ]);
        $radius = (float) ($data['radius'] ?? 10);

        $candidates = \App\Models\Vendor::query()
            ->where('status', VendorStatus::Approved->value)
            ->whereNotNull('lat')->whereNotNull('lng')
            ->get();

        $lat0 = deg2rad((float) $data['lat']);
        $lng0 = deg2rad((float) $data['lng']);

        $sorted = $candidates
            ->map(function ($v) use ($lat0, $lng0) {
                $lat1 = deg2rad((float) $v->lat);
                $lng1 = deg2rad((float) $v->lng);
                $a = sin(($lat1 - $lat0) / 2) ** 2
                    + cos($lat0) * cos($lat1) * sin(($lng1 - $lng0) / 2) ** 2;
                $v->setAttribute('distance_km', round(6371 * 2 * asin(min(1.0, sqrt($a))), 3));
                return $v;
            })
            ->filter(fn ($v) => $v->distance_km <= $radius)
            ->sortBy('distance_km')
            ->take(30)
            ->values();

        return ApiResponse::success(VendorResource::collection($sorted), 'Nearby vendors loaded.');
    }

    /** Globally most-ordered menu items in the last 24 hours. */
    public function itemsTrending(Request $request): JsonResponse
    {
        $rows = \App\Models\OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('created_at', '>=', now()->subDay()))
            ->whereNotNull('item_id')
            ->selectRaw('item_id, SUM(quantity) as recent_orders')
            ->groupBy('item_id')
            ->orderByDesc('recent_orders')
            ->limit(20)
            ->get();

        $items = \App\Models\MenuItem::query()
            ->whereIn('id', $rows->pluck('item_id'))
            ->with(['variants', 'addons', 'images'])
            ->get()
            ->keyBy('id');

        $payload = $rows
            ->map(function ($r) use ($items) {
                $item = $items->get($r->item_id);
                if (! $item) return null;
                return [
                    'item' => new MenuItemResource($item),
                    'recent_orders' => (int) $r->recent_orders,
                ];
            })
            ->filter()
            ->values();

        return ApiResponse::success($payload, 'Trending items loaded.');
    }

    /** Report a vendor for policy violations (queues for admin review). */
    public function report(Request $request, \App\Models\Vendor $vendor): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:100'],
            'detail' => ['nullable', 'string', 'max:2000'],
        ]);

        \App\Models\VendorReport::create([
            'vendor_id' => $vendor->id,
            'user_id' => $request->user()->id,
            'reason' => $data['reason'],
            'detail' => $data['detail'] ?? null,
        ]);

        return ApiResponse::success(null, 'Report submitted. Thank you.', 201);
    }

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
        $this->annotateDiscovery($vendor);

        return ApiResponse::success(new VendorResource($vendor), 'Vendor retrieved.');
    }

    /** Full menu grouped by category (only available items shown to the public). */
    public function menu(Request $request, string $idOrSlug): JsonResponse
    {
        $vendor = $this->resolveVendor($idOrSlug, $request);
        $this->annotateDiscovery($vendor);

        // 60s cache — menu reads are the hottest unauthenticated endpoint
        // and the payload eager-loads categories + items + variants + addons.
        // Vendor edits show up within ~1 minute; explicit invalidation isn't
        // worth the bookkeeping at this TTL.
        $payload = Cache::remember("vendor:{$vendor->id}:menu", 60, function () use ($vendor) {
            $categories = $vendor->categories()
                ->where('status', 'approved')
                ->with(['items' => fn ($q) => $q->where('is_available', true)->with(['variants', 'addons', 'images'])])
                ->orderBy('sort_order')
                ->get();

            $uncategorized = $vendor->items()
                ->whereNull('category_id')->where('is_available', true)
                ->with(['variants', 'addons', 'images'])->get();

            // ->all(): cached payloads must hold plain arrays, not Collections.
            $popularIds = $vendor->items()
                ->where('is_available', true)
                ->orderByDesc('orders_count')
                ->limit(5)
                ->pluck('id')
                ->all();

            return [
                'categories' => MenuCategoryResource::collection($categories)->resolve(),
                'uncategorized' => MenuItemResource::collection($uncategorized)->resolve(),
                'popular_items' => $popularIds,
            ];
        });

        return ApiResponse::success([
            'vendor' => new VendorResource($vendor),
            'categories' => $payload['categories'],
            'uncategorized' => $payload['uncategorized'],
            'popular_items' => $payload['popular_items'],
        ], 'Menu retrieved.');
    }

    /** Set the discovery-related transient attributes used by VendorResource. */
    private function annotateDiscovery(\App\Models\Vendor $vendor): void
    {
        $vendor->setAttribute('has_offer', \App\Models\Voucher::query()
            ->where(function ($q) use ($vendor) {
                $q->whereNull('vendor_id')->orWhere('vendor_id', $vendor->id);
            })
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('valid_to')->orWhere('valid_to', '>', now());
            })
            ->exists());

        // delivery_estimate is derived from prep_time_minutes (± buffer).
        $vendor->setAttribute('delivery_estimate_min', max(0, (int) $vendor->prep_time_minutes));
        $vendor->setAttribute('delivery_estimate_max', (int) $vendor->prep_time_minutes + 15);

        // opens_at: next opening boundary when closed right now.
        if (! $vendor->is_open) {
            $vendor->setAttribute('opens_at', $this->nextOpensAt($vendor));
        }
    }

    /** Walk operating_hours forward up to 7 days to find the next open time. */
    private function nextOpensAt(\App\Models\Vendor $vendor): ?string
    {
        $hours = $vendor->operatingHours()->get()->keyBy('day_of_week');
        $now = now();

        for ($i = 0; $i < 8; $i++) {
            $check = $now->copy()->addDays($i);
            $row = $hours->get($check->dayOfWeek);
            if (! $row || $row->is_closed || ! $row->open_time) continue;
            $open = $check->copy()->setTimeFromTimeString($row->open_time);
            if ($i === 0 && $open->lt($now)) continue;
            return $open->toIso8601String();
        }
        return null;
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

    /** Sales analytics for the vendor dashboard charts (cached 5 min per vendor). */
    public function analytics(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $days = min(max((int) $request->query('days', 14), 1), 90);

        $data = Cache::remember(
            "vendor:{$vendor->id}:analytics:{$days}",
            now()->addMinutes(5),
            fn () => $this->computeVendorAnalytics($vendor, $days),
        );

        return ApiResponse::success($data, 'Vendor analytics.');
    }

    /** @return array<string, mixed> */
    private function computeVendorAnalytics(Vendor $vendor, int $days): array
    {
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

        // Plain arrays only — this payload is cached, and serialized Collections
        // can unserialize as __PHP_Incomplete_Class and break the JSON shape.
        $statusDistribution = $vendor->orders()->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count])
            ->values()->all();

        $topItems = $vendor->items()->orderByDesc('orders_count')->limit(5)->get()
            ->map(fn ($it) => [
                'id' => $it->id, 'name' => $it->name,
                'orders_count' => (int) $it->orders_count, 'rating_avg' => (float) $it->rating_avg,
            ])->values()->all();

        return [
            'range_days' => $days,
            'revenue_series' => $series,
            'status_distribution' => $statusDistribution,
            'top_items' => $topItems,
            'lifetime_revenue' => round((float) $vendor->orders()->where('status', $delivered)->sum('total'), 2),
        ];
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

    // ---- P31 Vendor Dashboard v3 ----------------------------------------

    /** Customers who have ordered from this vendor, anonymised + lifetime stats. */
    public function customers(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $userIds = $vendor->orders()->distinct()->pluck('user_id');
        $blocked = VendorUserBlock::where('vendor_id', $vendor->id)->pluck('user_id')->flip();

        $payload = User::whereIn('id', $userIds)->with('profile')->get()->map(function ($u) use ($vendor, $blocked) {
            $orders = $vendor->orders()->where('user_id', $u->id);
            $last = (clone $orders)->latest()->first();
            return [
                'id' => $u->id,
                'display_name' => 'Customer #'.$u->id,
                'avatar' => $u->profile?->avatar,
                'orders_count' => (clone $orders)->count(),
                'total_spend' => round((float) (clone $orders)->sum('total'), 2),
                'last_order_at' => $last?->created_at?->toIso8601String(),
                'is_blocked' => $blocked->has($u->id),
            ];
        })->sortByDesc('total_spend')->values();

        return ApiResponse::success($payload, 'Customers loaded.');
    }

    /** Send a system-DM warning to a customer (queued for review on their side). */
    public function warnCustomer(Request $request, int $userId): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $request->validate(['message' => ['required', 'string', 'max:1000']]);

        app(NotificationService::class)->notify(
            $userId,
            'system',
            "Warning from {$vendor->name}",
            $data['message'],
            ['vendor_id' => $vendor->id],
        );

        return ApiResponse::success(null, 'Warning sent.', 201);
    }

    public function blockCustomer(Request $request, int $userId): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        VendorUserBlock::firstOrCreate(
            ['vendor_id' => $vendor->id, 'user_id' => $userId],
            ['reason' => $data['reason'] ?? null],
        );

        return ApiResponse::success(null, 'Customer blocked.', 201);
    }

    public function unblockCustomer(Request $request, int $userId): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        VendorUserBlock::where('vendor_id', $vendor->id)->where('user_id', $userId)->delete();

        return ApiResponse::success(null, 'Customer unblocked.');
    }

    // ---- Inventory ------------------------------------------------------

    public function inventory(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $items = InventoryItem::where('vendor_id', $vendor->id)->latest()->get()
            ->map(fn ($i) => [
                'id' => $i->id, 'name' => $i->name, 'unit' => $i->unit,
                'stock' => (float) $i->stock, 'threshold' => (float) $i->threshold,
                'status' => $i->status,
            ]);

        return ApiResponse::success($items, 'Inventory loaded.');
    }

    public function inventoryStore(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:20'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'threshold' => ['nullable', 'numeric', 'min:0'],
        ]);

        $item = InventoryItem::create(array_merge(['vendor_id' => $vendor->id], $data));

        return ApiResponse::success($item, 'Inventory item added.', 201);
    }

    public function inventoryUpdate(Request $request, InventoryItem $item): JsonResponse
    {
        $this->assertOwnsInventory($request, $item);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'unit' => ['sometimes', 'string', 'max:20'],
            'threshold' => ['sometimes', 'numeric', 'min:0'],
        ]);
        $item->update($data);

        return ApiResponse::success($item, 'Inventory item updated.');
    }

    public function inventoryDestroy(Request $request, InventoryItem $item): JsonResponse
    {
        $this->assertOwnsInventory($request, $item);
        $item->delete();

        return ApiResponse::success(null, 'Inventory item removed.');
    }

    /** Apply a positive or negative stock delta with an audit-style reason. */
    public function inventoryAdjust(Request $request, InventoryItem $item): JsonResponse
    {
        $this->assertOwnsInventory($request, $item);
        $data = $request->validate([
            'delta' => ['required', 'numeric'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);
        $item->stock = max(0, $item->stock + (float) $data['delta']);
        $item->save();

        return ApiResponse::success(
            ['id' => $item->id, 'stock' => (float) $item->stock, 'status' => $item->status],
            'Stock adjusted.',
        );
    }

    private function assertOwnsInventory(Request $request, InventoryItem $item): void
    {
        if ($item->vendor_id !== $request->user()->vendor?->id) {
            abort(403, 'Not your inventory item.');
        }
    }

    // ---- Vouchers (vendor self-service) --------------------------------

    public function vouchersIndex(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $vouchers = Voucher::where('vendor_id', $vendor->id)->latest()->get();

        return ApiResponse::success($vouchers, 'Vouchers loaded.');
    }

    public function vouchersStore(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:vouchers,code'],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['percentage', 'flat'])],
            'amount' => ['required', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
        ]);

        $voucher = Voucher::create(array_merge($data, ['vendor_id' => $vendor->id]));

        return ApiResponse::success($voucher, 'Voucher created.', 201);
    }

    public function vouchersUpdate(Request $request, Voucher $voucher): JsonResponse
    {
        if ($voucher->vendor_id !== $request->user()->vendor?->id) abort(403);

        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:40', Rule::unique('vouchers', 'code')->ignore($voucher->id)],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in(['percentage', 'flat'])],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'max_discount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'min_order' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'max_uses' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_user_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'valid_from' => ['sometimes', 'nullable', 'date'],
            'valid_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:valid_from'],
        ]);
        $voucher->update($data);

        return ApiResponse::success($voucher->fresh(), 'Voucher updated.');
    }

    public function vouchersDestroy(Request $request, Voucher $voucher): JsonResponse
    {
        if ($voucher->vendor_id !== $request->user()->vendor?->id) abort(403);
        $voucher->delete();

        return ApiResponse::success(null, 'Voucher removed.');
    }

    // ---- Item-level analytics + payouts + flash deals ------------------

    public function itemsAnalytics(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $days = min(max((int) $request->query('days', 30), 1), 90);
        $from = now()->subDays($days);

        $rows = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('vendor_id', $vendor->id)->where('created_at', '>=', $from))
            ->selectRaw('item_id, SUM(quantity) as units, SUM(line_total) as revenue')
            ->groupBy('item_id')
            ->orderByDesc('revenue')
            ->limit(20)
            ->get();

        $items = MenuItem::whereIn('id', $rows->pluck('item_id'))->get()->keyBy('id');

        $data = $rows->map(fn ($r) => [
            'item_id' => (int) $r->item_id,
            'name' => $items->get($r->item_id)?->name ?? 'Unknown',
            'units' => (int) $r->units,
            'revenue' => round((float) $r->revenue, 2),
            'rating_avg' => (float) ($items->get($r->item_id)?->rating_avg ?? 0),
        ]);

        return ApiResponse::success($data, 'Item analytics.');
    }

    /**
     * Payout breakdown (gross / commission / net) for delivered orders,
     * grouped by day or week (spec §6.7). A refunded order — even one that
     * reached 'delivered' before the refund — contributes nothing: the
     * vendor was never actually paid for it, so it must not inflate payouts.
     */
    public function payouts(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $days = min(max((int) $request->query('days', 30), 1), 365);
        $group = $request->query('group', 'day') === 'week' ? 'week' : 'day';
        $from = now()->subDays($days);

        $dateExpr = $group === 'week' ? "DATE(DATE_SUB(delivered_at, INTERVAL WEEKDAY(delivered_at) DAY))" : 'DATE(delivered_at)';
        // SQLite (tests) doesn't know WEEKDAY() — use its own week-start expression there.
        if (config('database.default') === 'sqlite') {
            $dateExpr = $group === 'week' ? "DATE(delivered_at, 'weekday 0', '-6 days')" : 'DATE(delivered_at)';
        }

        $paidQuery = fn () => $vendor->orders()
            ->where('status', OrderStatus::Delivered->value)
            ->where('payment_status', 'paid') // excludes refunded orders entirely
            ->where('delivered_at', '>=', $from);

        $rows = $paidQuery()
            ->selectRaw("{$dateExpr} as d, SUM(total) as gross, SUM(commission) as commission")
            ->groupBy('d')
            ->orderBy('d', 'desc')
            ->get();

        $data = $rows->map(fn ($r) => [
            'date' => $r->d,
            'gross' => round((float) $r->gross, 2),
            'commission' => round((float) $r->commission, 2),
            'net' => round((float) $r->gross - (float) $r->commission, 2),
        ]);

        $refundedCount = $vendor->orders()
            ->where('payment_status', 'refunded')
            ->where('delivered_at', '>=', $from)
            ->count();

        $lifetimeGross = (float) $vendor->orders()->where('status', OrderStatus::Delivered->value)->where('payment_status', 'paid')->sum('total');
        $lifetimeCommission = (float) $vendor->orders()->where('status', OrderStatus::Delivered->value)->where('payment_status', 'paid')->sum('commission');

        return ApiResponse::success([
            'group' => $group,
            'range_days' => $days,
            'series' => $data,
            'refunded_orders_excluded' => $refundedCount,
            'lifetime_gross' => round($lifetimeGross, 2),
            'lifetime_commission' => round($lifetimeCommission, 2),
            'lifetime_net' => round($lifetimeGross - $lifetimeCommission, 2),
        ], 'Payouts loaded.');
    }

    public function flashDealCreate(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);
        $data = $request->validate([
            'item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:90'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'quantity_limit' => ['nullable', 'integer', 'min:1'],
        ]);

        $item = MenuItem::find($data['item_id']);
        if (! $item || $item->vendor_id !== $vendor->id) {
            return ApiResponse::error('Item must belong to your store.', 422);
        }

        $deal = FlashDeal::create(array_merge($data, ['vendor_id' => $vendor->id]));

        return ApiResponse::success($deal, 'Flash deal created.', 201);
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
