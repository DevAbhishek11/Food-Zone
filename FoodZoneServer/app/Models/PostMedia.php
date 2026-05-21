<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    protected $table = 'post_media';

    protected $fillable = ['post_id', 'url', 'type', 'sort_order'];

    protected $casts = ['sort_order' => 'integer'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
