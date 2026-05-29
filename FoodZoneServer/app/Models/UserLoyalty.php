<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLoyalty extends Model
{
    protected $table = 'user_loyalty';

    protected $fillable = ['user_id', 'points', 'lifetime_points', 'tier'];

    protected $casts = [
        'points' => 'integer',
        'lifetime_points' => 'integer',
    ];

    public const TIERS = [
        'bronze'   => 0,
        'silver'   => 500,
        'gold'     => 2000,
        'platinum' => 5000,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Derive tier from a lifetime-points value. */
    public static function tierFor(int $lifetime): string
    {
        $tier = 'bronze';
        foreach (self::TIERS as $name => $floor) {
            if ($lifetime >= $floor) $tier = $name;
        }
        return $tier;
    }
}
