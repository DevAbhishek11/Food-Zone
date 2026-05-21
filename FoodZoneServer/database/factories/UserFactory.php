<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName().fake()->numberBetween(1, 9999),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->numerify('+9198########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::User->value,
            'status' => UserStatus::Active->value,
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'referral_code' => strtoupper(Str::random(8)),
            'remember_token' => Str::random(10),
        ];
    }

    /** Attach a profile row after the user is created. */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            if (! $user->profile()->exists()) {
                UserProfile::create(['user_id' => $user->id]);
            }
        });
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => UserRole::Admin->value]);
    }

    public function vendorRole(): static
    {
        return $this->state(fn () => ['role' => UserRole::Vendor->value]);
    }

    public function private(): static
    {
        return $this->afterCreating(fn (User $user) => $user->profile()->update(['is_private' => true]));
    }
}
