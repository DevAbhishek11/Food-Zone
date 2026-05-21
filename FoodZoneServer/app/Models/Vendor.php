<?php

namespace App\Models;

use App\Enums\VendorStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    /** @use HasFactory<\Database\Factories\VendorFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'slug', 'description', 'logo', 'banner',
        'business_license', 'tax_id', 'bank_account', 'contact_phone', 'contact_email',
        'address', 'city', 'lat', 'lng', 'radius_km',
        'status', 'rejection_reason', 'is_open', 'closed_message', 'commission_rate',
        'min_order_value', 'delivery_enabled', 'delivery_fee', 'free_delivery_above',
        'prep_time_minutes', 'cod_enabled', 'is_featured', 'approved_at',
        'rating_avg', 'rating_count', 'orders_count',
    ];

    protected $casts = [
        'status' => VendorStatus::class,
        'is_open' => 'boolean',
        'delivery_enabled' => 'boolean',
        'cod_enabled' => 'boolean',
        'is_featured' => 'boolean',
        'commission_rate' => 'float',
        'min_order_value' => 'float',
        'delivery_fee' => 'float',
        'free_delivery_above' => 'float',
        'rating_avg' => 'float',
        'lat' => 'float',
        'lng' => 'float',
        'radius_km' => 'float',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function operatingHours(): HasMany
    {
        return $this->hasMany(OperatingHour::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(OrderRating::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function isApproved(): bool
    {
        return $this->status === VendorStatus::Approved;
    }

    /** Whether the store is currently accepting orders. */
    public function isAcceptingOrders(): bool
    {
        return $this->isApproved() && $this->is_open;
    }
}
