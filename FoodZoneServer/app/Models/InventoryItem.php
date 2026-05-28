<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = ['vendor_id', 'name', 'unit', 'stock', 'threshold'];

    protected $casts = [
        'stock' => 'float',
        'threshold' => 'float',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function getStatusAttribute(): string
    {
        if ($this->stock <= 0) return 'out';
        if ($this->stock <= $this->threshold) return 'low';
        return 'ok';
    }
}
