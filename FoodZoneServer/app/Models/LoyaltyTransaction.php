<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyTransaction extends Model
{
    protected $fillable = ['user_id', 'amount', 'reason', 'order_id'];

    protected $casts = [
        'amount' => 'integer',
    ];
}
