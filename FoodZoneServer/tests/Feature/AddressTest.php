<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'label' => 'Home',
            'address' => '12 Baker Street',
            'city' => 'Mumbai',
            'state' => 'MH',
            'pincode' => '400001',
        ], $overrides);
    }

    public function test_first_address_becomes_default(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/addresses', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);
    }

    public function test_marking_a_new_address_default_unsets_others(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/addresses', $this->payload(['label' => 'Home']))->assertCreated();
        $this->postJson('/api/v1/addresses', $this->payload(['label' => 'Work', 'is_default' => true]))->assertCreated();

        $defaults = $user->addresses()->where('is_default', true)->get();
        $this->assertCount(1, $defaults);
        $this->assertEquals('Work', $defaults->first()->label);
    }

    public function test_user_can_list_update_and_delete_addresses(): void
    {
        $user = User::factory()->create();
        $address = UserAddress::create($this->payload(['user_id' => $user->id]));
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/addresses')->assertOk()->assertJsonCount(1, 'data');

        $this->putJson("/api/v1/addresses/{$address->id}", $this->payload(['city' => 'Pune']))
            ->assertOk()->assertJsonPath('data.city', 'Pune');

        $this->deleteJson("/api/v1/addresses/{$address->id}")->assertOk();
        $this->assertDatabaseMissing('user_addresses', ['id' => $address->id]);
    }

    public function test_cannot_touch_another_users_address(): void
    {
        $address = UserAddress::create($this->payload(['user_id' => User::factory()->create()->id]));
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/v1/addresses/{$address->id}", $this->payload())->assertStatus(403);
        $this->deleteJson("/api/v1/addresses/{$address->id}")->assertStatus(403);
    }

    public function test_order_snapshots_the_selected_address(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0]);
        $item = MenuItem::factory()->for($vendor)->create(['price' => 150]);
        $user = User::factory()->create();
        $address = UserAddress::create($this->payload(['user_id' => $user->id, 'city' => 'Delhi']));

        Sanctum::actingAs($user);
        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'cod',
            'address_id' => $address->id,
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.delivery_address.city', 'Delhi');
    }
}
