<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorUserBlock extends Model
{
    protected $fillable = ['vendor_id', 'user_id', 'reason'];
}
