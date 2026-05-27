<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Records security-sensitive actions (moderation, role changes, approvals) to an
 * immutable audit trail. Call from controllers right after the action succeeds.
 */
class AuditService
{
    /** @param array<string,mixed> $meta */
    public function log(?User $actor, string $action, ?Model $target = null, array $meta = []): AuditLog
    {
        return AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'auditable_type' => $target ? $target::class : null,
            'auditable_id' => $target?->getKey(),
            'meta' => $meta ?: null,
            'ip_address' => request()?->ip(),
        ]);
    }
}
