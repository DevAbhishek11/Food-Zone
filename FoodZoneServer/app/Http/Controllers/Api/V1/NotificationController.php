<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($notifications, NotificationResource::class, 'Notifications loaded.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return ApiResponse::success(
            ['unread' => $request->user()->notifications()->whereNull('read_at')->count()],
            'Unread count.'
        );
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        $this->assertOwner($request, $notification);
        $notification->markAsRead();

        return ApiResponse::success(new NotificationResource($notification->fresh()), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return ApiResponse::success(null, 'All notifications marked as read.');
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        $this->assertOwner($request, $notification);
        $notification->delete();

        return ApiResponse::success(null, 'Notification removed.');
    }

    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return ApiResponse::success(null, 'All notifications cleared.');
    }

    private function assertOwner(Request $request, Notification $notification): void
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403, 'This notification does not belong to you.');
        }
    }
}
