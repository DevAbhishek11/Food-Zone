<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\User;

/**
 * Centralised creation of in-app notifications. Broadcasts each new notification
 * on the recipient's private channel (real-time) when broadcasting is configured.
 */
class NotificationService
{
    public function notify(
        User|int $user,
        string $type,
        string $title,
        ?string $message = null,
        array $data = [],
        ?User $actor = null,
    ): Notification {
        // Embed a lightweight actor snapshot so clients can render avatars
        // and link to the person who triggered the notification.
        if ($actor !== null) {
            $data['actor'] = [
                'id' => $actor->id,
                'name' => $actor->name,
                'username' => $actor->username,
                'avatar' => $actor->profile?->avatar,
            ];
        }

        $notification = Notification::create([
            'user_id' => $user instanceof User ? $user->id : $user,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        event(new NotificationCreated($notification));

        // Fan out to the recipient's devices via Expo (off the request path).
        // Only dispatched when push is configured — see config/push.php.
        if (config('push.enabled')) {
            SendPushNotification::dispatch($notification->user_id, $title, $message ?? '', $data);
        }

        return $notification;
    }
}

