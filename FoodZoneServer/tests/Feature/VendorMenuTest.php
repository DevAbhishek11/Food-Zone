<?php

namespace Tests\Feature;

use App\Enums\VendorStatus;
use App\Models\MenuItem;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorMenuTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_apply_to_become_a_vendor(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/vendors/register', [
            'name' => 'Tasty Bites',
            'city' => 'Mumbai',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('vendors', ['name' => 'Tasty Bites', 'status' => 'pending']);
    }

    public function test_admin_can_approve_a_vendor_and_role_is_upgraded(): void
    {
        $admin = User::factory()->admin()->create();
        $vendor = Vendor::factory()->pending()->create();

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/admin/vendors/{$vendor->id}/approve")
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertEquals(VendorStatus::Approved, $vendor->fresh()->status);
        $this->assertEquals('vendor', $vendor->user->fresh()->role->value);
    }

    public function test_non_admin_cannot_approve_vendor(): void
    {
        $vendor = Vendor::factory()->pending()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/v1/admin/vendors/{$vendor->id}/approve")->assertStatus(403);
    }

    public function test_vendor_can_create_menu_item(): void
    {
        $vendor = Vendor::factory()->create();
        Sanctum::actingAs($vendor->user);

        $this->postJson('/api/v1/vendor/items', [
            'name' => 'Cheese Pizza',
            'price' => 299.00,
            'variants' => [['name' => 'Large', 'price_modifier' => 100]],
            'addons' => [['name' => 'Extra cheese', 'price' => 50]],
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Cheese Pizza');

        $this->assertDatabaseHas('menu_items', ['name' => 'Cheese Pizza', 'vendor_id' => $vendor->id]);
        $this->assertDatabaseHas('item_variants', ['name' => 'Large']);
    }

    public function test_vendor_cannot_edit_another_vendors_item(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $item = MenuItem::factory()->for($vendorB)->create();

        Sanctum::actingAs($vendorA->user);
        $this->putJson("/api/v1/vendor/items/{$item->id}", ['name' => 'Hacked'])
            ->assertStatus(403);
    }

    public function test_public_can_view_vendor_menu(): void
    {
        $vendor = Vendor::factory()->create();
        MenuItem::factory(3)->for($vendor)->create();

        $this->getJson("/api/v1/vendors/{$vendor->slug}/menu")
            ->assertOk()
            ->assertJsonPath('data.vendor.id', $vendor->id);
    }
}
