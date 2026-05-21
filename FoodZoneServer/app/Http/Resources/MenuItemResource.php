<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MenuItem */
class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor_id' => $this->vendor_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'dietary_tags' => $this->dietary_tags ?? [],
            'allergens' => $this->allergens ?? [],
            'is_available' => (bool) $this->is_available,
            'prep_time_minutes' => $this->prep_time_minutes,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => (int) $this->rating_count,
            'orders_count' => (int) $this->orders_count,
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($v) => [
                'id' => $v->id, 'name' => $v->name,
                'price_modifier' => (float) $v->price_modifier, 'is_default' => (bool) $v->is_default,
            ])),
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn ($a) => [
                'id' => $a->id, 'name' => $a->name,
                'price' => (float) $a->price, 'is_available' => (bool) $a->is_available,
            ])),
            'images' => $this->whenLoaded('images', fn () => $this->images->pluck('url')),
        ];
    }
}
