<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_responses_carry_security_headers(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_auth_endpoints_are_rate_limited(): void
    {
        // Rate limiting is disabled in the suite by default — turn it on here.
        config(['hardening.rate_limit' => true, 'hardening.auth_per_minute' => 20]);

        $last = null;
        for ($i = 0; $i <= 20; $i++) {
            // Distinct emails avoid the per-account login lockout, isolating the
            // per-IP throttle as the only source of a 429.
            $last = $this->postJson('/api/v1/auth/login', [
                'email' => "rl{$i}@example.com",
                'password' => 'wrong-password',
            ]);
        }

        $last->assertStatus(429); // the 21st request exceeds 20/min
    }

    public function test_admin_moderation_is_audit_logged_and_visible(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($admin);

        $this->putJson("/api/v1/admin/users/{$target->id}/ban", ['reason' => 'spam'])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'user.banned',
            'auditable_id' => $target->id,
        ]);

        $this->getJson('/api/v1/admin/audit-logs')
            ->assertOk()
            ->assertJsonPath('data.0.action', 'user.banned')
            ->assertJsonPath('data.0.actor.id', $admin->id);
    }
}
