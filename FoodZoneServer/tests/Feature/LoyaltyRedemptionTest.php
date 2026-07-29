<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserLoyalty;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LoyaltyRedemptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_redeem_points_for_wallet_credit(): void
    {
        $me = User::factory()->create();
        UserLoyalty::create(['user_id' => $me->id, 'points' => 500, 'lifetime_points' => 500, 'tier' => 'silver']);
        Sanctum::actingAs($me);

        $res = $this->postJson('/api/v1/loyalty/redeem', ['points' => 200])
            ->assertOk()
            ->assertJsonPath('data.points_redeemed', 200)
            ->assertJsonPath('data.wallet_credit', 20) // default rate 0.1/point
            ->assertJsonPath('data.remaining_points', 300);

        $this->assertEquals(20.0, app(WalletService::class)->balanceFor($me)->balance);
    }

    public function test_redeeming_does_not_reduce_lifetime_points_or_tier(): void
    {
        $me = User::factory()->create();
        UserLoyalty::create(['user_id' => $me->id, 'points' => 500, 'lifetime_points' => 2500, 'tier' => 'gold']);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/loyalty/redeem', ['points' => 200])->assertOk();

        $fresh = UserLoyalty::where('user_id', $me->id)->first();
        $this->assertEquals(2500, $fresh->lifetime_points);
        $this->assertEquals('gold', $fresh->tier);
    }

    public function test_cannot_redeem_more_points_than_available(): void
    {
        $me = User::factory()->create();
        UserLoyalty::create(['user_id' => $me->id, 'points' => 100, 'lifetime_points' => 100, 'tier' => 'bronze']);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/loyalty/redeem', ['points' => 500])->assertStatus(422);
    }

    public function test_redemption_below_the_minimum_is_rejected(): void
    {
        $me = User::factory()->create();
        UserLoyalty::create(['user_id' => $me->id, 'points' => 500, 'lifetime_points' => 500, 'tier' => 'silver']);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/loyalty/redeem', ['points' => 10])->assertStatus(422);
    }
}
