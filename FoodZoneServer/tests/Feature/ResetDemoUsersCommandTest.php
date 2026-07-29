<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetDemoUsersCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_resets_known_demo_accounts_to_the_documented_password(): void
    {
        User::factory()->create(['email' => 'admin@foodzone.app', 'password' => Hash::make('drifted-hash')]);
        User::factory()->create(['email' => 'alice@example.com', 'password' => Hash::make('also-drifted')]);

        $this->artisan('dev:reset-demo-users')->assertSuccessful();

        $this->assertTrue(Hash::check('password', User::where('email', 'admin@foodzone.app')->first()->password));
        $this->assertTrue(Hash::check('password', User::where('email', 'alice@example.com')->first()->password));
    }

    public function test_skips_missing_demo_accounts_without_failing(): void
    {
        // Neither demo account seeded — command should still succeed.
        $this->artisan('dev:reset-demo-users')->assertSuccessful();
    }

    public function test_refuses_to_run_in_production(): void
    {
        app()['env'] = 'production';

        $this->artisan('dev:reset-demo-users')->assertFailed();

        app()['env'] = 'testing';
    }
}
