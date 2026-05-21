<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),
            'category_id' => null,
            'name' => fake()->randomElement(['Margherita Pizza', 'Veg Burger', 'Paneer Tikka', 'Cold Coffee', 'Chocolate Brownie']),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 50, 500),
            'is_available' => true,
            'prep_time_minutes' => fake()->numberBetween(10, 40),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn () => ['is_available' => false]);
    }
}
