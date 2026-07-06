<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminVendorControlTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_update_vendor_commission_rate(): void
    {
        $vendor = Vendor::factory()->create(['commission_rate' => 5]);
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/v1/admin/vendors/{$vendor->id}", ['commission_rate' => 8.5])
            ->assertOk();

        $this->assertEquals(8.5, $vendor->fresh()->commission_rate);
        // Vendor is notified about the new rate.
        $this->assertDatabaseHas('notifications', ['user_id' => $vendor->user_id, 'type' => 'system']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'vendor.updated']);
    }

    public function test_admin_can_force_close_a_store(): void
    {
        $vendor = Vendor::factory()->create(['is_open' => true]);
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/v1/admin/vendors/{$vendor->id}", ['is_open' => false])
            ->assertOk();

        $this->assertFalse($vendor->fresh()->is_open);
        $this->assertDatabaseHas('notifications', ['user_id' => $vendor->user_id, 'type' => 'system']);
    }

    public function test_commission_rate_is_bounded(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/v1/admin/vendors/{$vendor->id}", ['commission_rate' => 51])
            ->assertStatus(422);
    }

    public function test_empty_update_is_rejected(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/v1/admin/vendors/{$vendor->id}", [])->assertStatus(422);
    }

    public function test_non_admin_cannot_update_vendor(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/admin/vendors/{$vendor->id}", ['commission_rate' => 10])
            ->assertStatus(403);
    }

    public function test_admin_can_verify_an_unverified_user(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/v1/admin/users/{$user->id}/verify")->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.verified']);
    }

    public function test_verifying_an_already_verified_user_fails(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/v1/admin/users/{$user->id}/verify")->assertStatus(422);
    }
}
