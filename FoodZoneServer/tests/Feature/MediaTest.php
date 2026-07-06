<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_upload_an_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $res = $this->postJson('/api/v1/media', [
            'file' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
            'category' => 'avatar',
        ])->assertCreated()->assertJsonStructure(['data' => ['url', 'path', 'disk']]);

        $path = $res->json('data.path');
        $this->assertStringStartsWith('uploads/avatar/', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertStringStartsWith('http', $res->json('data.url'));
    }

    public function test_every_client_category_is_accepted(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        // Categories the web + mobile clients actually send. 'story' was
        // missing from the whitelist once, silently breaking story uploads.
        foreach (['avatar', 'cover', 'post', 'story', 'vendor', 'menu', 'misc'] as $category) {
            $this->postJson('/api/v1/media', [
                'file' => UploadedFile::fake()->image("{$category}.jpg", 100, 100),
                'category' => $category,
            ])->assertCreated();
        }
    }

    public function test_upload_rejects_non_images(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/media', [
            'file' => UploadedFile::fake()->create('virus.pdf', 100, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrorFor('file');
    }

    public function test_upload_rejects_oversized_files(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/media', [
            'file' => UploadedFile::fake()->image('huge.jpg')->size(12000), // 12MB > 10MB cap
        ])->assertStatus(422)->assertJsonValidationErrorFor('file');
    }

    public function test_upload_requires_authentication(): void
    {
        Storage::fake('public');
        $this->postJson('/api/v1/media', [
            'file' => UploadedFile::fake()->image('a.jpg'),
        ])->assertStatus(401);
    }
}
