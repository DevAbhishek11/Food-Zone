<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id', 'user_id', 'body',
        'replied_to_message_id', 'type', 'media_url',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** The message this one is a reply to (nullable). */
    public function repliedTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'replied_to_message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function starred(): HasMany
    {
        return $this->hasMany(StarredMessage::class);
    }
}
