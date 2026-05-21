<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    protected $fillable = [
        'vendor_id', 'code', 'description', 'type', 'amount', 'max_discount',
        'min_order', 'max_uses', 'per_user_limit', 'used_count', 'stackable',
        'is_active', 'valid_from', 'valid_to',
    ];

    protected $casts = [
        'amount' => 'float',
        'max_discount' => 'float',
        'min_order' => 'float',
        'max_uses' => 'integer',
        'per_user_limit' => 'integer',
        'used_count' => 'integer',
        'stackable' => 'boolean',
        'is_active' => 'boolean',
        'valid_from' => 'datetime',
        'valid_to' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(VoucherRedemption::class);
    }

    /**
     * Validate whether this voucher can be applied for the given user/order context.
     * Returns null when valid, or a human-readable error string when not.
     */
    public function validateFor(User $user, float $orderSubtotal, ?int $vendorId): ?string
    {
        if (! $this->is_active) {
            return 'This voucher is no longer active.';
        }

        $now = now();
        if ($this->valid_from && $now->lt($this->valid_from)) {
            return 'This voucher is not valid yet.';
        }
        if ($this->valid_to && $now->gt($this->valid_to)) {
            return 'This voucher has expired.';
        }

        if ($this->vendor_id !== null && $this->vendor_id !== $vendorId) {
            return 'This voucher is not valid for this store.';
        }

        if ($orderSubtotal < (float) $this->min_order) {
            return 'Order does not meet the minimum amount for this voucher.';
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return 'This voucher has reached its usage limit.';
        }

        $userUses = $this->redemptions()->where('user_id', $user->id)->count();
        if ($userUses >= $this->per_user_limit) {
            return 'You have already used this voucher.';
        }

        return null;
    }

    /** Compute the discount this voucher yields for a given subtotal. */
    public function discountFor(float $subtotal): float
    {
        if ($this->type === 'percentage') {
            $discount = $subtotal * ((float) $this->amount / 100);
            if ($this->max_discount !== null) {
                $discount = min($discount, (float) $this->max_discount);
            }
        } else {
            $discount = (float) $this->amount;
        }

        return round(min($discount, $subtotal), 2);
    }
}
