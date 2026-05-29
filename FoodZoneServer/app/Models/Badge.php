<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $fillable = ['key', 'name', 'description', 'icon', 'threshold'];

    protected $casts = [
        'threshold' => 'integer',
    ];
}
