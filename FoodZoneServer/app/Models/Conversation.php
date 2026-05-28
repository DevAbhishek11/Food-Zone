<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = ['last_message_at'];

    protected $casts = ['last_message_at' => 'datetime'];

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_user')
            ->withPivot('last_read_at', 'is_pinned', 'is_muted', 'muted_until')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function hasParticipant(int $userId): bool
    {
        return $this->participants()->where('users.id', $userId)->exists();
    }

    /** Find the existing 1:1 conversation between two users, or null. */
    public static function between(int $userA, int $userB): ?self
    {
        return self::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $userA))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $userB))
            ->withCount('participants')
            ->get()
            ->firstWhere('participants_count', 2);
    }
}
