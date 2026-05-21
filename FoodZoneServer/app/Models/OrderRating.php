<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderRating extends Model
{
    protected $fillable = [
        'order_id', 'user_id', 'vendor_id', 'rating', 'review',
        'images', 'vendor_reply', 'vendor_replied_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'images' => 'array',
        'vendor_replied_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
