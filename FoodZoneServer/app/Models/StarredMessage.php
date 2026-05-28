<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StarredMessage extends Model
{
    protected $fillable = ['message_id', 'user_id'];
}
