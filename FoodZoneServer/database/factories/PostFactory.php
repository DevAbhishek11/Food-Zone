<?php

namespace Database\Factories;

use App\Enums\PostPrivacy;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'body' => fake()->sentence(12),
            'privacy' => PostPrivacy::Public->value,
            'type' => 'text',
        ];
    }

    public function followersOnly(): static
    {
        return $this->state(fn () => ['privacy' => PostPrivacy::Followers->value]);
    }

    public function private(): static
    {
        return $this->state(fn () => ['privacy' => PostPrivacy::Private->value]);
    }
}
