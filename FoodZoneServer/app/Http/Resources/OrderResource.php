<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status?->value,
            'user_id' => $this->user_id,
            'vendor_id' => $this->vendor_id,
            'vendor' => $this->whenLoaded('vendor', fn () => [
                'id' => $this->vendor->id,
                'name' => $this->vendor->name,
                'logo' => $this->vendor->logo,
            ]),
            'customer' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
            ]),
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'delivery_charge' => (float) $this->delivery_charge,
            'tax' => (float) $this->tax,
            'total' => (float) $this->total,
            'commission' => (float) $this->commission,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'notes' => $this->notes,
            'cancellation_reason' => $this->cancellation_reason,
            'delivery_address' => $this->delivery_address,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'rating' => $this->whenLoaded('rating', fn () => $this->rating ? [
                'rating' => $this->rating->rating,
                'review' => $this->rating->review,
            ] : null),
            'status_history' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'status' => $h->status,
                'note' => $h->note,
                'at' => $h->created_at?->toIso8601String(),
            ])),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
