<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Permanently deletes accounts whose 30-day deletion grace period has
 * elapsed (spec §8.2, §22.4). Runs daily from the scheduler.
 */
class PurgeDeletedUsers extends Command
{
    protected $signature = 'users:purge-deleted';

    protected $description = 'Permanently delete user accounts past their 30-day deletion grace period';

    public function handle(): int
    {
        $due = User::query()
            ->whereNotNull('deletion_requested_at')
            ->where('deletion_requested_at', '<=', now()->subDays(30))
            ->get();

        $purged = 0;
        foreach ($due as $user) {
            // Isolate each account: an FK constraint or DB hiccup on one
            // user must not abort the whole run — this is a daily,
            // compliance-relevant job, and a silent full-run failure would
            // mean no account ever gets purged until someone notices.
            try {
                DB::transaction(function () use ($user) {
                    // Orders, posts, and everything else keyed on user_id
                    // cascade-delete per their own migrations — this is a
                    // genuine purge, not a soft anonymisation.
                    $user->tokens()->delete();
                    $user->delete();
                });
                $purged++;
            } catch (\Throwable $e) {
                Log::error('Failed to purge deleted user — will retry next run', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            }
        }

        $this->info("Purged {$purged}/{$due->count()} account(s) past their deletion grace period.");

        return self::SUCCESS;
    }
}
