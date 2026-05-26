<?php

namespace Tests\Feature;

use App\Models\ItemAddon;
use App\Models\ItemVariant;
use App\Models\MenuItem;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutQuoteTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Vendor, 1: MenuItem} */
    private function vendorWithItem(array $vendorAttrs = [], float $price = 200): array
    {
        $vendor = Vendor::factory()->create($vendorAttrs);
        $item = MenuItem::factory()->for($vendor)->create(['price' => $price]);

        return [$vendor, $item];
    }

    public function test_quote_returns_totals_including_delivery(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['delivery_fee' => 30, 'delivery_enabled' => true], 100);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/checkout/quote', [
            'vendor_id' => $vendor->id,
            'items' => [['item_id' => $item->id, 'quantity' => 2]],
        ])->assertOk()
            ->assertJsonPath('data.subtotal', 200)
            ->assertJsonPath('data.delivery_charge', 30)
            ->assertJsonPath('data.total', 230);
    }

    public function test_quote_applies_a_valid_voucher(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['delivery_fee' => 0], 300);
        Voucher::create([
            'code' => 'SAVE50', 'type' => 'flat', 'amount' => 50,
            'min_order' => 100, 'per_user_limit' => 1, 'is_active' => true,
        ]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/checkout/quote', [
            'vendor_id' => $vendor->id,
            'voucher_code' => 'SAVE50',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertOk()
            ->assertJsonPath('data.discount', 50)
            ->assertJsonPath('data.total', 250)
            ->assertJsonPath('data.voucher.code', 'SAVE50')
            ->assertJsonPath('data.voucher_error', null);
    }

    public function test_quote_reports_an_invalid_voucher_without_failing(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['delivery_fee' => 0], 300);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/checkout/quote', [
            'vendor_id' => $vendor->id,
            'voucher_code' => 'NOPE',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertOk()
            ->assertJsonPath('data.discount', 0)
            ->assertJsonPath('data.total', 300)
            ->assertJsonPath('data.voucher', null)
            ->assertJsonPath('data.voucher_error', 'Invalid voucher code.');
    }

    public function test_quote_prices_variants_and_addons(): void
    {
        [$vendor, $item] = $this->vendorWithItem(['delivery_fee' => 0], 200);
        $variant = ItemVariant::create(['item_id' => $item->id, 'name' => 'Large', 'price_modifier' => 50, 'is_default' => false]);
        $addon = ItemAddon::create(['item_id' => $item->id, 'name' => 'Extra cheese', 'price' => 30, 'is_available' => true]);
        Sanctum::actingAs(User::factory()->create());

        // (200 base + 50 variant + 30 addon) * 2 = 560
        $this->postJson('/api/v1/checkout/quote', [
            'vendor_id' => $vendor->id,
            'items' => [[
                'item_id' => $item->id,
                'quantity' => 2,
                'variant_id' => $variant->id,
                'addon_ids' => [$addon->id],
            ]],
        ])->assertOk()
            ->assertJsonPath('data.subtotal', 560)
            ->assertJsonPath('data.total', 560)
            ->assertJsonPath('data.lines.0.unit_price', 280)
            ->assertJsonPath('data.lines.0.customizations.variant.name', 'Large');
    }
}
