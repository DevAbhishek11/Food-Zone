<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\VendorResource;
use App\Http\Resources\ViolationResource;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Violation;
use App\Models\ViolationAction;
use Illuminate\Support\Facades\DB;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private AuditService $audit,
        private \App\Contracts\PaymentGateway $gateway,
        private \App\Services\WalletService $walletService,
    ) {}

    /** Immutable audit trail of moderation/admin actions. */
    public function auditLogs(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->string('action')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', (int) $request->input('user_id')))
            ->with('user')
            ->latest()
            ->paginate(30);

        return ApiResponse::paginated($logs, AuditLogResource::class, 'Audit logs loaded.');
    }

    public function dashboard(): JsonResponse
    {
        $today = now()->startOfDay();

        return ApiResponse::success([
            'users_total' => User::count(),
            'users_new_today' => User::where('created_at', '>=', $today)->count(),
            'vendors_total' => Vendor::count(),
            'vendors_approved' => Vendor::where('status', VendorStatus::Approved->value)->count(),
            'vendors_pending' => Vendor::where('status', VendorStatus::Pending->value)->count(),
            'orders_total' => Order::count(),
            'orders_today' => Order::where('created_at', '>=', $today)->count(),
            'posts_total' => Post::count(),
            'revenue_today' => round((float) Order::where('created_at', '>=', $today)
                ->where('status', OrderStatus::Delivered->value)->sum('total'), 2),
            'commission_today' => round((float) Order::where('created_at', '>=', $today)
                ->where('status', OrderStatus::Delivered->value)->sum('commission'), 2),
            'reports_open' => Violation::where('status', 'open')->count(),
        ], 'Dashboard metrics.');
    }

    /** Time-series + distributions for the dashboard charts (cached 5 min). */
    public function analytics(Request $request): JsonResponse
    {
        $days = min(max((int) $request->query('days', 14), 1), 90);

        $data = Cache::remember("admin:analytics:{$days}", now()->addMinutes(5), fn () => $this->computeAnalytics($days));

        return ApiResponse::success($data, 'Analytics.');
    }

    /** @return array<string, mixed> */
    private function computeAnalytics(int $days): array
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $delivered = OrderStatus::Delivered->value;

        // Orders + revenue per calendar day (DATE() works on MySQL and SQLite).
        $orderRows = Order::where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw("SUM(CASE WHEN status = '{$delivered}' THEN total ELSE 0 END) as revenue")
            ->groupBy('d')->pluck('orders', 'd');
        $revenueRows = Order::where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d')
            ->selectRaw("SUM(CASE WHEN status = '{$delivered}' THEN total ELSE 0 END) as revenue")
            ->groupBy('d')->pluck('revenue', 'd');
        $userRows = User::where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')->pluck('c', 'd');

        $revenueSeries = [];
        $usersSeries = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::parse($from)->addDays($i)->toDateString();
            $revenueSeries[] = [
                'date' => $date,
                'orders' => (int) ($orderRows[$date] ?? 0),
                'revenue' => round((float) ($revenueRows[$date] ?? 0), 2),
            ];
            $usersSeries[] = ['date' => $date, 'count' => (int) ($userRows[$date] ?? 0)];
        }

        // Plain arrays only — this payload is cached, and serialized Collections
        // can unserialize as __PHP_Incomplete_Class and break the JSON shape.
        $statusDistribution = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count])
            ->values()->all();

        $topVendors = Vendor::orderByDesc('orders_count')->limit(5)->get()
            ->map(fn ($v) => [
                'id' => $v->id, 'name' => $v->name,
                'orders_count' => (int) $v->orders_count, 'rating_avg' => (float) $v->rating_avg,
            ])->values()->all();

        return [
            'range_days' => $days,
            'revenue_series' => $revenueSeries,
            'users_series' => $usersSeries,
            'status_distribution' => $statusDistribution,
            'top_vendors' => $topVendors,
        ];
    }

    /** Platform-wide order monitoring (filterable). */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('vendor_id'), fn ($q) => $q->where('vendor_id', (int) $request->input('vendor_id')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->string('payment_status')))
            ->when($request->filled('q'), fn ($q) => $q->where('order_number', 'like', '%'.$request->string('q').'%'))
            ->with(['vendor', 'user', 'items'])
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($orders, OrderResource::class, 'Orders loaded.');
    }

    /**
     * Admin-initiated refund for dispute resolution (spec §5.6). Works on any
     * order with a captured payment, regardless of order status — unlike the
     * customer self-cancel flow, which only allows refunding pending orders.
     */
    public function refundOrder(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        if ($order->payment_status !== 'paid') {
            return ApiResponse::error('This order has no captured payment to refund.', 422);
        }

        $amount = $data['amount'] ?? (float) $order->total;
        $note = $amount < (float) $order->total
            ? sprintf('Partial refund of %.2f issued: %s', $amount, $data['reason'])
            : 'Refund issued: '.$data['reason'];

        // A wallet-paid order never created a gateway Payment row (the
        // wallet debited synchronously at checkout) — refund instantly to
        // the wallet instead of looking for a gateway charge that isn't there.
        if ($order->payment_method === 'wallet') {
            DB::transaction(function () use ($order, $note, $amount) {
                $this->walletService->credit($order->user, $amount, 'order_refund', $order, $note);
                $order->update(['payment_status' => 'refunded']);
                $order->statusHistory()->create([
                    'status' => $order->status->value,
                    'changed_by' => request()->user()->id,
                    'note' => $note,
                ]);
            });
        } else {
            $payment = $order->payments()->where('status', 'paid')->latest()->first();
            if (! $payment) {
                return ApiResponse::error('No captured payment found for this order.', 422);
            }

            try {
                $ok = $this->gateway->refund($payment, $data['amount'] ?? null);
            } catch (\Throwable $e) {
                Log::error('Admin refund gateway call failed', ['order' => $order->id, 'error' => $e->getMessage()]);

                return ApiResponse::error('The payment gateway could not be reached. No refund was issued — try again shortly.', 502);
            }
            if (! $ok) {
                return ApiResponse::error('The payment gateway rejected the refund.', 502);
            }

            DB::transaction(function () use ($order, $payment, $note) {
                $payment->update(['status' => 'refunded']);
                $order->update(['payment_status' => 'refunded']);
                $order->statusHistory()->create([
                    'status' => $order->status->value,
                    'changed_by' => request()->user()->id,
                    'note' => $note,
                ]);
            });
        }

        $this->notifications->notify($order->user_id, 'order_status', 'Refund issued',
            "A refund for order {$order->order_number} has been processed. Reason: {$data['reason']}",
            ['order_id' => $order->id]);
        $this->audit->log($request->user(), 'order.refunded', $order, [
            'reason' => $data['reason'], 'amount' => $data['amount'] ?? (float) $order->total,
        ]);

        return ApiResponse::success(new OrderResource($order->fresh()), 'Refund processed.');
    }

    /** Apply a moderation action to several users at once. */
    public function bulkUsers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['ban', 'suspend', 'unban'])],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'days' => ['required_if:action,suspend', 'integer', Rule::in([7, 14, 30])],
        ]);

        $targets = User::whereIn('id', $data['user_ids'])
            ->whereNotIn('role', [UserRole::Admin->value, UserRole::SuperAdmin->value])
            ->get();

        foreach ($targets as $user) {
            match ($data['action']) {
                'ban' => $user->forceFill(['status' => UserStatus::Banned->value]),
                'suspend' => $user->forceFill([
                    'status' => UserStatus::Suspended->value,
                    'suspended_until' => now()->addDays($data['days']),
                ]),
                'unban' => $user->forceFill(['status' => UserStatus::Active->value, 'suspended_until' => null]),
            };
            $user->save();
            if ($data['action'] !== 'unban') {
                $user->tokens()->delete();
            }
            $this->audit->log($request->user(), "user.{$data['action']}", $user, ['bulk' => true]);
        }

        return ApiResponse::success(['affected' => $targets->count()], 'Bulk action applied.');
    }

    public function users(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('username', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->with('profile')
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($users, UserResource::class, 'Users loaded.');
    }

    /**
     * One-stop detail panel for a user: activity summary + recent orders,
     * posts and violations, so admins don't have to piece it together
     * across separate screens (spec §5.2).
     */
    public function userDetail(User $user): JsonResponse
    {
        $user->load('profile');

        $orders = $user->orders()->latest()->limit(10)->get(['id', 'order_number', 'status', 'total', 'created_at']);
        $posts = $user->posts()->latest()->limit(10)->get(['id', 'body', 'privacy', 'likes_count', 'comments_count', 'created_at']);
        $violations = $user->violations()->latest()->limit(10)->get(['id', 'type', 'severity', 'status', 'created_at']);

        return ApiResponse::success([
            'user' => new UserResource($user),
            'stats' => [
                'orders_count' => $user->orders()->count(),
                'orders_total_spent' => (float) $user->orders()->where('status', OrderStatus::Delivered->value)->sum('total'),
                'posts_count' => $user->posts()->count(),
                'violations_count' => $user->violations()->count(),
                'violations_open' => $user->violations()->where('status', 'open')->count(),
            ],
            'recent_orders' => $orders,
            'recent_posts' => $posts,
            'recent_violations' => $violations,
        ], 'User detail loaded.');
    }

    public function banUser(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return ApiResponse::error('Admins cannot be banned.', 422);
        }

        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:255']])['reason'] ?? null;

        $user->forceFill(['status' => UserStatus::Banned->value])->save();
        $user->tokens()->delete();
        $this->notifications->notify($user->id, 'system', 'Account banned',
            $reason ?? 'Your account has been permanently banned for policy violations.');
        $this->audit->log($request->user(), 'user.banned', $user, ['reason' => $reason]);

        return ApiResponse::success(new UserResource($user->fresh()), 'User banned.');
    }

    public function suspendUser(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return ApiResponse::error('Admins cannot be suspended.', 422);
        }

        $data = $request->validate([
            'days' => ['required', 'integer', Rule::in([7, 14, 30])],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $until = now()->addDays($data['days']);
        $user->forceFill([
            'status' => UserStatus::Suspended->value,
            'suspended_until' => $until,
        ])->save();
        $user->tokens()->delete();
        $this->notifications->notify($user->id, 'system', 'Account suspended',
            ($data['reason'] ?? 'Your account has been suspended.')." Until {$until->toDateString()}.");
        $this->audit->log($request->user(), 'user.suspended', $user, ['days' => $data['days'], 'reason' => $data['reason'] ?? null]);

        return ApiResponse::success(new UserResource($user->fresh()), "User suspended for {$data['days']} days.");
    }

    public function unbanUser(Request $request, User $user): JsonResponse
    {
        $user->forceFill([
            'status' => UserStatus::Active->value,
            'suspended_until' => null,
        ])->save();
        $this->notifications->notify($user->id, 'system', 'Account reinstated',
            'Your account has been reinstated. Welcome back.');
        $this->audit->log($request->user(), 'user.reinstated', $user);

        return ApiResponse::success(new UserResource($user->fresh()), 'User reinstated.');
    }

    public function vendors(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with('user')
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($vendors, VendorResource::class, 'Vendors loaded.');
    }

    public function approveVendor(Request $request, Vendor $vendor): JsonResponse
    {
        if ($vendor->status === VendorStatus::Approved) {
            return ApiResponse::error('Vendor is already approved.', 422);
        }

        $vendor->update([
            'status' => VendorStatus::Approved->value,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
        $vendor->user->forceFill(['role' => UserRole::Vendor->value])->save();
        $this->notifications->notify($vendor->user_id, 'system', 'Vendor approved',
            "Congratulations! Your store \"{$vendor->name}\" has been approved.");
        $this->audit->log($request->user(), 'vendor.approved', $vendor, ['name' => $vendor->name]);

        return ApiResponse::success(new VendorResource($vendor->fresh()), 'Vendor approved.');
    }

    public function rejectVendor(Request $request, Vendor $vendor): JsonResponse
    {
        $reason = $request->validate(['reason' => ['required', 'string', 'max:255']])['reason'];

        $vendor->update([
            'status' => VendorStatus::Rejected->value,
            'rejection_reason' => $reason,
        ]);
        $this->notifications->notify($vendor->user_id, 'system', 'Vendor application rejected', $reason);
        $this->audit->log($request->user(), 'vendor.rejected', $vendor, ['reason' => $reason]);

        return ApiResponse::success(new VendorResource($vendor->fresh()), 'Vendor rejected.');
    }

    // ---- P32 Admin Console v3 -------------------------------------------

    /** Filterable list of moderation violations (reports queue). */
    public function violations(Request $request): JsonResponse
    {
        $violations = Violation::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->with(['user.profile', 'reporter.profile', 'actions'])
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($violations, ViolationResource::class, 'Violations loaded.');
    }

    /** Apply a moderation action on a violation (warn / suspend / ban / dismiss / remove_content). */
    public function resolveViolation(Request $request, Violation $violation): JsonResponse
    {
        $data = $request->validate([
            'action_type' => ['required', Rule::in(['dismiss', 'warn', 'suspend', 'ban', 'remove_content'])],
            'days' => ['required_if:action_type,suspend', 'integer', Rule::in([7, 14, 30])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
        $me = $request->user();

        DB::transaction(function () use ($violation, $data, $me) {
            $offender = $violation->user;

            switch ($data['action_type']) {
                case 'dismiss':
                    $violation->update(['status' => 'dismissed', 'handled_by' => $me->id]);
                    break;

                case 'warn':
                    $this->notifications->notify(
                        $offender->id, 'system', 'Policy warning',
                        $data['notes'] ?? 'A moderator has issued a warning. Please review our community guidelines.',
                    );
                    $violation->update(['status' => 'resolved', 'handled_by' => $me->id]);
                    break;

                case 'suspend':
                    $until = now()->addDays($data['days']);
                    $offender->forceFill([
                        'status' => UserStatus::Suspended->value,
                        'suspended_until' => $until,
                    ])->save();
                    $offender->tokens()->delete();
                    $this->notifications->notify(
                        $offender->id, 'system', 'Account suspended',
                        ($data['notes'] ?? 'Your account has been suspended.')." Until {$until->toDateString()}.",
                    );
                    $violation->update(['status' => 'resolved', 'handled_by' => $me->id]);
                    break;

                case 'ban':
                    $offender->forceFill(['status' => UserStatus::Banned->value])->save();
                    $offender->tokens()->delete();
                    $this->notifications->notify(
                        $offender->id, 'system', 'Account banned',
                        $data['notes'] ?? 'Your account has been permanently banned.',
                    );
                    $violation->update(['status' => 'resolved', 'handled_by' => $me->id]);
                    break;

                case 'remove_content':
                    $subject = $violation->subject;
                    $subject?->delete();
                    $violation->update(['status' => 'resolved', 'handled_by' => $me->id]);
                    break;
            }

            ViolationAction::create([
                'violation_id' => $violation->id,
                'action_type' => $data['action_type'],
                'performed_by' => $me->id,
                'notes' => $data['notes'] ?? null,
            ]);
            $this->audit->log($me, "moderation.{$data['action_type']}", $violation, ['offender_id' => $offender->id]);
        });

        return ApiResponse::success(null, 'Action applied.');
    }

    /** Platform revenue breakdown over a window, with top-vendor slice. */
    public function revenue(Request $request): JsonResponse
    {
        $days = min(max((int) $request->query('days', 30), 1), 365);
        $from = now()->subDays($days);

        $base = Order::where('status', OrderStatus::Delivered->value)->where('created_at', '>=', $from);
        $gross = (float) (clone $base)->sum('total');
        $commission = (float) (clone $base)->sum('commission');
        $refunded = (float) Order::where('payment_status', 'refunded')
            ->where('updated_at', '>=', $from)->sum('total');

        $topRows = (clone $base)
            ->selectRaw('vendor_id, SUM(total) as gross, SUM(commission) as commission')
            ->groupBy('vendor_id')
            ->orderByDesc('gross')
            ->limit(10)
            ->get();
        $vendors = Vendor::whereIn('id', $topRows->pluck('vendor_id'))->get()->keyBy('id');
        $topVendors = $topRows->map(fn ($r) => [
            'vendor_id' => (int) $r->vendor_id,
            'vendor_name' => $vendors->get($r->vendor_id)?->name ?? 'Unknown',
            'gross' => round((float) $r->gross, 2),
            'commission' => round((float) $r->commission, 2),
            'net' => round((float) $r->gross - (float) $r->commission, 2),
        ]);

        return ApiResponse::success([
            'range_days' => $days,
            'gross' => round($gross, 2),
            'commission' => round($commission, 2),
            'refunded' => round($refunded, 2),
            'net' => round($gross - $commission, 2),
            'top_vendors' => $topVendors,
        ], 'Revenue breakdown.');
    }

    /** Toggle a vendor's homepage-feature flag. */
    public function featureVendor(Request $request, Vendor $vendor): JsonResponse
    {
        $vendor->update(['is_featured' => ! $vendor->is_featured]);
        $this->audit->log($request->user(), $vendor->is_featured ? 'vendor.featured' : 'vendor.unfeatured', $vendor);

        return ApiResponse::success(['is_featured' => (bool) $vendor->is_featured], 'Toggled.');
    }

    /**
     * Platform-level vendor controls: commission rate, featured flag,
     * force open/close. Each change is audited; the vendor is notified.
     */
    public function updateVendor(Request $request, Vendor $vendor): JsonResponse
    {
        $data = $request->validate([
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:50'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_open' => ['sometimes', 'boolean'],
        ]);

        if ($data === []) {
            return ApiResponse::error('Nothing to update.', 422);
        }

        $before = $vendor->only(array_keys($data));
        $vendor->update($data);
        $this->audit->log($request->user(), 'vendor.updated', $vendor, [
            'before' => $before, 'after' => $data,
        ]);

        if (array_key_exists('commission_rate', $data)) {
            $this->notifications->notify($vendor->user_id, 'system', 'Commission rate updated',
                "Your platform commission rate is now {$data['commission_rate']}%.");
        }
        if (array_key_exists('is_open', $data) && ! $data['is_open']) {
            $this->notifications->notify($vendor->user_id, 'system', 'Store closed by FoodZone',
                'Your store was closed by platform administration. Contact support for details.');
        }

        return ApiResponse::success(new VendorResource($vendor->fresh()), 'Vendor updated.');
    }

    /** Manually mark a user's email as verified (support flow). */
    public function verifyUser(Request $request, User $user): JsonResponse
    {
        if ($user->email_verified_at !== null) {
            return ApiResponse::error('User is already verified.', 422);
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        $this->notifications->notify($user->id, 'system', 'Account verified',
            'Your account has been verified by our team. Enjoy FoodZone!');
        $this->audit->log($request->user(), 'user.verified', $user);

        return ApiResponse::success(new UserResource($user->fresh()), 'User verified.');
    }

    /** Send a system-wide notification to all users or a filtered segment. */
    public function broadcast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'message' => ['required', 'string', 'max:500'],
            'segment' => ['nullable', Rule::in(['all', 'users', 'vendors', 'admins', 'verified'])],
        ]);
        $segment = $data['segment'] ?? 'all';

        $query = User::query()->where('status', UserStatus::Active->value);
        if ($segment === 'users') $query->where('role', UserRole::User->value);
        elseif ($segment === 'vendors') $query->where('role', UserRole::Vendor->value);
        elseif ($segment === 'admins') $query->whereIn('role', [UserRole::Admin->value, UserRole::SuperAdmin->value]);
        elseif ($segment === 'verified') $query->where('is_verified', true);

        // Per-recipient isolation: one bad row must not abort the whole
        // broadcast after it's already reached hundreds of users — an admin
        // seeing a 500 here would likely re-send, double-notifying everyone
        // who already succeeded.
        $count = 0;
        $failed = 0;
        $query->chunk(200, function ($users) use ($data, &$count, &$failed) {
            foreach ($users as $u) {
                try {
                    $this->notifications->notify($u->id, 'system', $data['title'], $data['message']);
                    $count++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::error('Broadcast notification failed for a user', ['user_id' => $u->id, 'error' => $e->getMessage()]);
                }
            }
        });

        $this->audit->log($request->user(), 'platform.broadcast', null, [
            'segment' => $segment, 'count' => $count, 'failed' => $failed, 'title' => $data['title'],
        ]);

        return ApiResponse::success(['recipients' => $count, 'failed' => $failed], 'Broadcast sent.');
    }

    /** Lightweight system-health snapshot (DB/cache/queue/storage) for the admin home. */
    public function systemHealth(): JsonResponse
    {
        $health = app(HealthController::class);

        return ApiResponse::success([
            'database' => $health->database(),
            'cache' => $health->cache(),
            'queue' => $health->queue(),
            'storage' => $health->storage(),
        ], 'System health snapshot.');
    }
}
