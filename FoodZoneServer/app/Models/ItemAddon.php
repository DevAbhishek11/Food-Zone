<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemAddon extends Model
{
    protected $fillable = ['item_id', 'name', 'price', 'is_available'];

    protected $casts = [
        'price' => 'float',
        'is_available' => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }
}
