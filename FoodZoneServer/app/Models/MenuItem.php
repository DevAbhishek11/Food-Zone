<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    /** @use HasFactory<\Database\Factories\MenuItemFactory> */
    use HasFactory;

    protected $fillable = [
        'vendor_id', 'category_id', 'name', 'description', 'price',
        'dietary_tags', 'allergens', 'is_available', 'prep_time_minutes',
        'rating_avg', 'rating_count', 'orders_count',
    ];

    protected $casts = [
        'price' => 'float',
        'dietary_tags' => 'array',
        'allergens' => 'array',
        'is_available' => 'boolean',
        'rating_avg' => 'float',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ItemVariant::class, 'item_id');
    }

    public function addons(): HasMany
    {
        return $this->hasMany(ItemAddon::class, 'item_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ItemImage::class, 'item_id')->orderBy('sort_order');
    }
}
