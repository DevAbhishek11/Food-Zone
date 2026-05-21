<?php

namespace Database\Factories;

use App\Enums\VendorStatus;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Vendor>
 */
class VendorFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->company().' Kitchen';

        return [
            'user_id' => User::factory()->vendorRole(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 999999),
            'description' => fake()->sentence(),
            'status' => VendorStatus::Approved->value,
            'is_open' => true,
            'city' => fake()->city(),
            'commission_rate' => 5.00,
            'min_order_value' => 0,
            'delivery_enabled' => true,
            'delivery_fee' => 20,
            'cod_enabled' => true,
            'prep_time_minutes' => 30,
            'approved_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => VendorStatus::Pending->value, 'approved_at' => null]);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['is_open' => false]);
    }
}
