<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_combined_search_returns_grouped_results(): void
    {
        User::factory()->create(['name' => 'Pizza Lover', 'username' => 'pizzafan']);
        $vendor = Vendor::factory()->create(['name' => 'Pizza Palace']);
        Post::factory()->create(['body' => 'Best pizza in town', 'privacy' => 'public']);

        $this->getJson('/api/v1/search?q=pizza')
            ->assertOk()
            ->assertJsonStructure(['data' => ['users', 'vendors', 'posts']])
            ->assertJsonPath('data.vendors.0.name', 'Pizza Palace');
    }

    public function test_typed_search_is_paginated(): void
    {
        User::factory()->create(['username' => 'sushichef']);
        User::factory(2)->create();

        $this->getJson('/api/v1/search?q=sushi&type=users')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.username', 'sushichef')
            ->assertJsonStructure(['meta' => ['current_page', 'has_more']]);
    }

    public function test_search_requires_min_length_for_typed_queries(): void
    {
        $this->getJson('/api/v1/search?q=a&type=users')->assertStatus(422);
    }

    public function test_vendor_search_excludes_unapproved(): void
    {
        Vendor::factory()->create(['name' => 'Taco Town']);
        Vendor::factory()->pending()->create(['name' => 'Taco Secret']);

        $this->getJson('/api/v1/search?q=taco&type=vendors')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Taco Town');
    }

    public function test_post_search_only_returns_public_posts(): void
    {
        $author = User::factory()->create();
        Post::factory()->for($author)->create(['body' => 'secret ramen recipe', 'privacy' => 'private']);
        Post::factory()->for($author)->create(['body' => 'public ramen night', 'privacy' => 'public']);

        $this->getJson('/api/v1/search?q=ramen&type=posts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'public ramen night');
    }

    public function test_search_excludes_blocked_users(): void
    {
        $me = User::factory()->create();
        $blocked = User::factory()->create(['username' => 'noisyuser']);
        $me->blocks()->create(['blocked_id' => $blocked->id]);

        Sanctum::actingAs($me);
        $this->getJson('/api/v1/search?q=noisyuser&type=users')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
