<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemVariant extends Model
{
    protected $fillable = ['item_id', 'name', 'price_modifier', 'is_default'];

    protected $casts = [
        'price_modifier' => 'float',
        'is_default' => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }
}
