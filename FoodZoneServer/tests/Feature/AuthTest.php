<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receives_a_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'username' => 'jane_doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.username', 'jane_doe')
            ->assertJsonStructure(['data' => ['user' => ['id', 'email'], 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertDatabaseHas('user_profiles', ['user_id' => User::first()->id]);
    }

    public function test_registration_validation_fails_for_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Dup',
            'username' => 'dupuser',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrorFor('email');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'log@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'log@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'log@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'log@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrorFor('email');
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        User::factory()->create(['email' => 'lock@example.com']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'lock@example.com',
                'password' => 'wrong',
            ])->assertStatus(422);
        }

        $locked = $this->postJson('/api/v1/auth/login', [
            'email' => 'lock@example.com',
            'password' => 'wrong',
        ])->assertStatus(422);

        $this->assertStringContainsString('Too many login attempts', $locked->getContent());
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_self(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_email_verification_flow(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Verify Me',
            'username' => 'verifyme',
            'email' => 'verify@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'verify@example.com')->first();
        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->email_verification_token);

        $this->postJson('/api/v1/auth/verify-email', [
            'email' => 'verify@example.com',
            'token' => $user->email_verification_token,
        ])->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_banned_user_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create(['status' => \App\Enums\UserStatus::Banned->value]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/feed')->assertStatus(403);
    }
}
