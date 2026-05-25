<?php

use App\Models\Conversation;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
| Private broadcast channels. Authorised via the `auth:sanctum` guard (see
| AppServiceProvider). Each callback returns true/false for the given user.
*/

// A user's personal channel (notifications, order updates addressed to them).
Broadcast::channel('user.{id}', function (User $user, int $id) {
    return (int) $user->id === (int) $id;
});

// A specific order's channel — the customer, the owning vendor, or an admin.
Broadcast::channel('order.{orderId}', function (User $user, int $orderId) {
    $order = Order::find($orderId);
    if (! $order) {
        return false;
    }

    return $order->user_id === $user->id
        || ($user->vendor && $order->vendor_id === $user->vendor->id)
        || $user->isAdmin();
});

// A conversation channel — only its participants.
Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    return Conversation::find($conversationId)?->hasParticipant($user->id) ?? false;
});
