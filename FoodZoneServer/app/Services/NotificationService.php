<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

/**
 * Centralised creation of in-app notifications. (Push/email channels can be
 * layered on later by dispatching jobs from here.)
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

        return Notification::create([
            'user_id' => $user instanceof User ? $user->id : $user,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
