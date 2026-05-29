<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = ['user_id', 'type', 'channel', 'enabled'];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public const TYPES = [
        'like', 'comment', 'follow', 'mention', 'order_status', 'system',
        'story_mention', 'post_tagged', 'vendor_offer', 'flash_deal',
    ];

    public const CHANNELS = ['push', 'email', 'in_app'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
