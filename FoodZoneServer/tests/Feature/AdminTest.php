<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_dashboard_metrics(): void
    {
        User::factory(3)->create();
        Vendor::factory()->pending()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'users_total', 'vendors_total', 'vendors_pending', 'vendors_approved',
                'orders_total', 'orders_today', 'posts_total', 'revenue_today', 'commission_today',
            ]])
            ->assertJsonPath('data.vendors_pending', 1);
    }

    public function test_non_admin_cannot_access_admin_area(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/admin/dashboard')->assertStatus(403);
        $this->getJson('/api/v1/admin/users')->assertStatus(403);
    }

    public function test_admin_can_search_and_filter_users(): void
    {
        User::factory()->create(['username' => 'findme_user', 'name' => 'Find Me']);
        User::factory(2)->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/users?q=findme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.username', 'findme_user');
    }

    public function test_admin_can_ban_suspend_and_reinstate_a_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        $this->putJson("/api/v1/admin/users/{$user->id}/ban", ['reason' => 'Spam'])->assertOk();
        $this->assertEquals(UserStatus::Banned, $user->fresh()->status);

        $this->putJson("/api/v1/admin/users/{$user->id}/unban")->assertOk();
        $this->assertEquals(UserStatus::Active, $user->fresh()->status);

        $this->putJson("/api/v1/admin/users/{$user->id}/suspend", ['days' => 7])->assertOk();
        $this->assertEquals(UserStatus::Suspended, $user->fresh()->status);
        $this->assertNotNull($user->fresh()->suspended_until);
    }

    public function test_admin_cannot_ban_another_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->putJson("/api/v1/admin/users/{$other->id}/ban")->assertStatus(422);
    }

    public function test_admin_can_approve_and_reject_vendors(): void
    {
        $admin = User::factory()->admin()->create();
        $approve = Vendor::factory()->pending()->create();
        $reject = Vendor::factory()->pending()->create();
        Sanctum::actingAs($admin);

        $this->putJson("/api/v1/admin/vendors/{$approve->id}/approve")
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->putJson("/api/v1/admin/vendors/{$reject->id}/reject", ['reason' => 'Incomplete documents'])
            ->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->assertEquals('Incomplete documents', $reject->fresh()->rejection_reason);
    }

    public function test_banned_user_loses_token_access(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/admin/users/{$user->id}/ban")->assertOk();

        // The banned user, acting with their session, is blocked by the `active` middleware.
        Sanctum::actingAs($user->fresh());
        $this->getJson('/api/v1/feed')->assertStatus(403);
    }
}
