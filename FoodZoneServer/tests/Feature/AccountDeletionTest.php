<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_deletion_with_correct_password(): void
    {
        $me = User::factory()->create(['password' => Hash::make('secret123')]);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/profile/request-deletion', ['password' => 'secret123'])->assertOk();

        $fresh = $me->fresh();
        $this->assertEquals(UserStatus::Deactivated, $fresh->status);
        $this->assertNotNull($fresh->deletion_requested_at);
        $this->assertEquals(0, $me->tokens()->count());
    }

    public function test_deletion_request_requires_correct_password(): void
    {
        $me = User::factory()->create(['password' => Hash::make('secret123')]);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/profile/request-deletion', ['password' => 'wrong'])->assertStatus(422);
        $this->assertEquals(UserStatus::Active, $me->fresh()->status);
    }

    public function test_deactivated_user_can_log_in_but_is_blocked_until_reactivated(): void
    {
        $me = User::factory()->create(['password' => Hash::make('secret123')]);
        Sanctum::actingAs($me);
        $this->postJson('/api/v1/profile/request-deletion', ['password' => 'secret123'])->assertOk();

        // Fresh token (simulating a real re-login) still gets blocked by EnsureActiveUser.
        Sanctum::actingAs($me->fresh());
        $this->getJson('/api/v1/feed')->assertStatus(403);
    }

    public function test_reactivate_cancels_a_pending_deletion(): void
    {
        $me = User::factory()->create([
            'password' => Hash::make('secret123'),
            'status' => UserStatus::Deactivated->value,
            'deactivated_at' => now(),
            'deletion_requested_at' => now(),
        ]);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/profile/reactivate')->assertOk()->assertJsonPath('data.status', 'active');

        $fresh = $me->fresh();
        $this->assertEquals(UserStatus::Active, $fresh->status);
        $this->assertNull($fresh->deletion_requested_at);
        $this->assertNull($fresh->deactivated_at);

        // And is no longer blocked.
        $this->getJson('/api/v1/feed')->assertOk();
    }

    public function test_reactivating_an_already_active_account_fails(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/profile/reactivate')->assertStatus(422);
    }

    public function test_purge_command_deletes_accounts_past_the_grace_period(): void
    {
        $overdue = User::factory()->create([
            'status' => UserStatus::Deactivated->value,
            'deletion_requested_at' => now()->subDays(31),
        ]);
        $withinGrace = User::factory()->create([
            'status' => UserStatus::Deactivated->value,
            'deletion_requested_at' => now()->subDays(10),
        ]);
        $neverRequested = User::factory()->create();

        $this->artisan('users:purge-deleted')->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $overdue->id]);
        $this->assertDatabaseHas('users', ['id' => $withinGrace->id]);
        $this->assertDatabaseHas('users', ['id' => $neverRequested->id]);
    }
}
