<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Grouped mode: Today / This Week / Earlier — single response, no pagination.
        if ($request->boolean('grouped')) {
            $items = $request->user()->notifications()
                ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
                ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
                ->latest()
                ->limit(100)
                ->get();

            $today = now()->startOfDay();
            $weekStart = now()->startOfWeek();

            $groups = ['today' => [], 'this_week' => [], 'earlier' => []];
            foreach ($items as $n) {
                if ($n->created_at >= $today) {
                    $groups['today'][] = $n;
                } elseif ($n->created_at >= $weekStart) {
                    $groups['this_week'][] = $n;
                } else {
                    $groups['earlier'][] = $n;
                }
            }

            return ApiResponse::success([
                'today' => NotificationResource::collection($groups['today'])->resolve(),
                'this_week' => NotificationResource::collection($groups['this_week'])->resolve(),
                'earlier' => NotificationResource::collection($groups['earlier'])->resolve(),
            ], 'Notifications loaded.');
        }

        $notifications = $request->user()->notifications()
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($notifications, NotificationResource::class, 'Notifications loaded.');
    }

    /** Per-type per-channel preferences. Returns a defaulted matrix even when none have been saved. */
    public function preferences(Request $request): JsonResponse
    {
        $saved = $request->user()->notificationPreferences()->get()
            ->groupBy('type')
            ->map(fn ($g) => $g->keyBy('channel'));

        $matrix = [];
        foreach (NotificationPreference::TYPES as $type) {
            foreach (NotificationPreference::CHANNELS as $channel) {
                $matrix[$type][$channel] = $saved[$type][$channel]->enabled ?? true;
            }
        }

        return ApiResponse::success($matrix, 'Notification preferences loaded.');
    }

    public function savePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferences' => ['required', 'array', 'min:1'],
            'preferences.*.type' => ['required', 'string', 'in:'.implode(',', NotificationPreference::TYPES)],
            'preferences.*.channel' => ['required', 'string', 'in:'.implode(',', NotificationPreference::CHANNELS)],
            'preferences.*.enabled' => ['required', 'boolean'],
        ]);

        $userId = $request->user()->id;
        foreach ($data['preferences'] as $p) {
            NotificationPreference::updateOrCreate(
                ['user_id' => $userId, 'type' => $p['type'], 'channel' => $p['channel']],
                ['enabled' => (bool) $p['enabled']],
            );
        }

        return $this->preferences($request);
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
