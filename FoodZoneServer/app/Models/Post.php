<?php

namespace App\Models;

use App\Enums\PostPrivacy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Scout\Searchable;

class Post extends Model
{
    /** @use HasFactory<\Database\Factories\PostFactory> */
    use HasFactory, Searchable;

    protected $fillable = [
        'user_id', 'body', 'privacy', 'type',
        'tagged_vendor_id', 'tagged_item_id', 'location',
        'shared_post_id', 'is_pinned',
    ];

    protected $casts = [
        'privacy' => PostPrivacy::class,
        'is_pinned' => 'boolean',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
        'shares_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('sort_order');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function taggedVendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'tagged_vendor_id');
    }

    public function taggedItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'tagged_item_id');
    }

    public function sharedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'shared_post_id');
    }

    public function savedBy(): HasMany
    {
        return $this->hasMany(SavedPost::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(PostShare::class);
    }

    public function isLikedBy(int $userId): bool
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    // ---- Scout (search) -------------------------------------------------

    /** Only public posts are indexed for search. */
    public function shouldBeSearchable(): bool
    {
        return $this->privacy === PostPrivacy::Public;
    }

    /** @return array<string, mixed> */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'privacy' => $this->privacy?->value,
            'user_id' => $this->user_id,
        ];
    }
}
