<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Vendor */
class VendorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo' => $this->logo,
            'banner' => $this->banner,
            'status' => $this->status?->value,
            'is_open' => (bool) $this->is_open,
            'closed_message' => $this->closed_message,
            'city' => $this->city,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'min_order_value' => (float) $this->min_order_value,
            'delivery_enabled' => (bool) $this->delivery_enabled,
            'delivery_fee' => (float) $this->delivery_fee,
            'free_delivery_above' => $this->free_delivery_above !== null ? (float) $this->free_delivery_above : null,
            'prep_time_minutes' => (int) $this->prep_time_minutes,
            'cod_enabled' => (bool) $this->cod_enabled,
            'is_featured' => (bool) $this->is_featured,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => (int) $this->rating_count,
            'orders_count' => (int) $this->orders_count,
            'commission_rate' => (float) $this->commission_rate,
            'categories' => MenuCategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
