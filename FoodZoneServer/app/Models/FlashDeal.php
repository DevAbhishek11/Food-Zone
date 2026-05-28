<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlashDeal extends Model
{
    protected $fillable = [
        'vendor_id', 'item_id', 'discount_percent',
        'starts_at', 'ends_at', 'quantity_limit', 'claimed_count',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'discount_percent' => 'integer',
        'quantity_limit' => 'integer',
        'claimed_count' => 'integer',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('starts_at', '<=', now())->where('ends_at', '>', now());
    }
}
