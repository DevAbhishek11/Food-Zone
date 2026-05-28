<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id', 'bio', 'avatar', 'cover', 'website', 'location', 'is_private',
        'food_preferences', 'dietary_restrictions',
        'followers_count', 'following_count', 'posts_count',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'food_preferences' => 'array',
        'dietary_restrictions' => 'array',
        'followers_count' => 'integer',
        'following_count' => 'integer',
        'posts_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
