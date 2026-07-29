<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Resets the seeded demo accounts' passwords back to "password".
 *
 * Exists because a demo credential's hash can drift out of sync with what's
 * documented (happened once with admin@foodzone.app during manual testing)
 * with no obvious symptom beyond "login just stopped working". Dev/staging
 * only — refuses to run in production so nobody can reset a real password
 * from a doc comment.
 */
class ResetDemoUsers extends Command
{
    protected $signature = 'dev:reset-demo-users';

    protected $description = 'Reset the seeded demo accounts (admin@foodzone.app, alice@example.com) to password "password"';

    /** Keep in sync with DatabaseSeeder's documented demo credentials. */
    private const DEMO_EMAILS = ['admin@foodzone.app', 'alice@example.com'];

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('Refusing to run in production.');

            return self::FAILURE;
        }

        $reset = 0;
        foreach (self::DEMO_EMAILS as $email) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                $this->warn("Skipped {$email} — not found (seed the database first?).");

                continue;
            }

            $user->forceFill(['password' => Hash::make('password')])->save();
            $this->info("Reset {$email}");
            $reset++;
        }

        $this->info("Done — {$reset} account(s) reset to password \"password\".");

        return self::SUCCESS;
    }
}
