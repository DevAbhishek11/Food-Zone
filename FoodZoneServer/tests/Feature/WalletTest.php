<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_starts_at_zero_and_shows_balance(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->getJson('/api/v1/wallet')->assertOk()->assertJsonPath('data.balance', 0);
    }

    public function test_wallet_service_credit_and_debit_maintain_a_ledger(): void
    {
        $user = User::factory()->create();
        $service = app(WalletService::class);

        $service->credit($user, 100, 'admin_credit', null, 'Welcome bonus');
        $this->assertEquals(100, $service->balanceFor($user)->balance);

        $service->debit($user, 40, 'order_payment', null, 'Order FZ-1');
        $this->assertEquals(60, $service->balanceFor($user)->balance);

        $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'amount' => 100, 'balance_after' => 100]);
        $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'amount' => -40, 'balance_after' => 60]);
    }

    public function test_debit_fails_with_insufficient_balance(): void
    {
        $user = User::factory()->create();
        $service = app(WalletService::class);
        $service->credit($user, 10, 'admin_credit');

        $this->expectException(\App\Exceptions\ApiException::class);
        $service->debit($user, 50, 'order_payment');
    }

    public function test_wallet_transactions_are_listed_paginated(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $service = app(WalletService::class);
        $service->credit($user, 50, 'admin_credit', null, 'Goodwill credit');

        $this->getJson('/api/v1/wallet/transactions')
            ->assertOk()
            ->assertJsonPath('data.0.amount', 50)
            ->assertJsonPath('data.0.type', 'admin_credit');
    }

    public function test_placing_an_order_with_wallet_debits_it_and_marks_order_paid(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0, 'delivery_enabled' => false]);
        $item = \App\Models\MenuItem::factory()->for($vendor)->create(['price' => 100, 'is_available' => true]);
        $customer = User::factory()->create();
        app(WalletService::class)->credit($customer, 200, 'admin_credit');

        Sanctum::actingAs($customer);
        $res = $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'wallet',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();

        $res->assertJsonPath('data.payment_status', 'paid');
        $this->assertEquals(100, app(WalletService::class)->balanceFor($customer)->balance);
        $this->assertDatabaseHas('orders', ['id' => $res->json('data.id'), 'wallet_amount' => 100, 'payment_status' => 'paid']);
    }

    public function test_placing_an_order_with_insufficient_wallet_balance_fails(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0, 'delivery_enabled' => false]);
        $item = \App\Models\MenuItem::factory()->for($vendor)->create(['price' => 100, 'is_available' => true]);
        $customer = User::factory()->create();
        app(WalletService::class)->credit($customer, 10, 'admin_credit');

        Sanctum::actingAs($customer);
        $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'wallet',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_cancelling_a_wallet_paid_order_refunds_the_wallet(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0, 'delivery_enabled' => false]);
        $item = \App\Models\MenuItem::factory()->for($vendor)->create(['price' => 100, 'is_available' => true]);
        $customer = User::factory()->create();
        app(WalletService::class)->credit($customer, 100, 'admin_credit');

        Sanctum::actingAs($customer);
        $order = $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'wallet',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $this->assertEquals(0, app(WalletService::class)->balanceFor($customer)->balance);

        $this->postJson("/api/v1/orders/{$order['id']}/cancel")->assertOk();

        $this->assertEquals(100, app(WalletService::class)->balanceFor($customer)->fresh()->balance);
    }

    public function test_admin_refund_credits_wallet_for_a_wallet_paid_order(): void
    {
        $vendor = Vendor::factory()->create(['min_order_value' => 0, 'delivery_fee' => 0, 'delivery_enabled' => false]);
        $item = \App\Models\MenuItem::factory()->for($vendor)->create(['price' => 150, 'is_available' => true]);
        $customer = User::factory()->create();
        app(WalletService::class)->credit($customer, 150, 'admin_credit');

        Sanctum::actingAs($customer);
        $order = $this->postJson('/api/v1/orders', [
            'vendor_id' => $vendor->id,
            'payment_method' => 'wallet',
            'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson("/api/v1/admin/orders/{$order['id']}/refund", ['reason' => 'Customer complaint'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'refunded');

        $this->assertEquals(150, app(WalletService::class)->balanceFor($customer)->fresh()->balance);
    }
}
