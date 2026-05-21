<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViolationAction extends Model
{
    protected $fillable = ['violation_id', 'action_type', 'performed_by', 'notes'];

    public function violation(): BelongsTo
    {
        return $this->belongsTo(Violation::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
