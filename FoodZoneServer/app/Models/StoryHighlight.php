<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoryHighlight extends Model
{
    protected $fillable = ['user_id', 'name', 'cover_url', 'story_ids'];

    protected $casts = ['story_ids' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
