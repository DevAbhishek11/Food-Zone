<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

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

        foreach ($due as $user) {
            // Orders, posts, and everything else keyed on user_id cascade-
            // delete per their own migrations — this is a genuine purge,
            // not a soft anonymisation.
            $user->tokens()->delete();
            $user->delete();
        }

        $this->info("Purged {$due->count()} account(s) past their deletion grace period.");

        return self::SUCCESS;
    }
}
