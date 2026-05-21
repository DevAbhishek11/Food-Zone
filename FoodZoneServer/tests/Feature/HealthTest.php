<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_reports_status(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonStructure([
                'status', 'timestamp', 'version',
                'services' => ['database', 'cache', 'queue', 'storage'],
            ])
            ->assertJsonPath('status', 'healthy')
            ->assertJsonPath('services.database.status', 'up');
    }

    public function test_database_health_subroute(): void
    {
        $this->getJson('/api/v1/health/database')
            ->assertOk()
            ->assertJsonPath('status', 'up');
    }
}
