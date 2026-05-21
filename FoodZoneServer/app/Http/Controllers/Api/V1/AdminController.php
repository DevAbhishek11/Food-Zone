<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\VendorResource;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

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
        ], 'Dashboard metrics.');
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

        return ApiResponse::success(new UserResource($user->fresh()), "User suspended for {$data['days']} days.");
    }

    public function unbanUser(User $user): JsonResponse
    {
        $user->forceFill([
            'status' => UserStatus::Active->value,
            'suspended_until' => null,
        ])->save();
        $this->notifications->notify($user->id, 'system', 'Account reinstated',
            'Your account has been reinstated. Welcome back.');

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

    public function approveVendor(Vendor $vendor): JsonResponse
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

        return ApiResponse::success(new VendorResource($vendor->fresh()), 'Vendor rejected.');
    }
}
