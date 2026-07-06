<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationsV3Test extends TestCase
{
    use RefreshDatabase;

    public function test_grouped_index_buckets_by_today_this_week_earlier(): void
    {
        // Freeze mid-week: on Mondays "start of week + 1h" would fall in the
        // "today" bucket and make the assertion date-dependent.
        $this->travelTo(now()->startOfWeek()->addDays(3)->setTime(12, 0));

        $me = User::factory()->create();

        $mk = function (User $me, $when) {
            $n = new Notification([
                'user_id' => $me->id, 'type' => 'system', 'title' => 'T',
            ]);
            $n->timestamps = false;
            $n->created_at = $when;
            $n->updated_at = $when;
            $n->save();
        };

        $mk($me, now());                    // today
        $mk($me, now()->startOfWeek()->addHour()); // this week
        $mk($me, now()->subWeeks(3));        // earlier

        Sanctum::actingAs($me);
        $res = $this->getJson('/api/v1/notifications?grouped=1')->assertOk()->json('data');

        $this->assertCount(1, $res['today']);
        $this->assertCount(1, $res['this_week']);
        $this->assertCount(1, $res['earlier']);
    }

    public function test_grouped_index_can_filter_by_type(): void
    {
        $me = User::factory()->create();
        Notification::create(['user_id' => $me->id, 'type' => 'like', 'title' => 'A']);
        Notification::create(['user_id' => $me->id, 'type' => 'follow', 'title' => 'B']);

        Sanctum::actingAs($me);
        $data = $this->getJson('/api/v1/notifications?grouped=1&type=like')->assertOk()->json('data');

        $all = array_merge($data['today'], $data['this_week'], $data['earlier']);
        $this->assertCount(1, $all);
        $this->assertSame('like', $all[0]['type']);
    }

    public function test_preferences_defaults_every_channel_to_enabled(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $matrix = $this->getJson('/api/v1/notifications/preferences')->assertOk()->json('data');

        $this->assertTrue($matrix['like']['push']);
        $this->assertTrue($matrix['flash_deal']['email']);
        $this->assertTrue($matrix['post_tagged']['in_app']);
    }

    public function test_save_preferences_persists_and_returns_updated_matrix(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $res = $this->postJson('/api/v1/notifications/preferences', [
            'preferences' => [
                ['type' => 'like', 'channel' => 'email', 'enabled' => false],
                ['type' => 'flash_deal', 'channel' => 'push', 'enabled' => false],
            ],
        ])->assertOk();

        $this->assertFalse($res->json('data.like.email'));
        $this->assertFalse($res->json('data.flash_deal.push'));
        $this->assertTrue($res->json('data.like.push'));

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $me->id, 'type' => 'like', 'channel' => 'email', 'enabled' => false,
        ]);
    }

    public function test_save_preferences_updates_existing_row(): void
    {
        $me = User::factory()->create();
        NotificationPreference::create([
            'user_id' => $me->id, 'type' => 'like', 'channel' => 'push', 'enabled' => false,
        ]);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/notifications/preferences', [
            'preferences' => [['type' => 'like', 'channel' => 'push', 'enabled' => true]],
        ])->assertOk();

        $this->assertSame(1, NotificationPreference::where([
            'user_id' => $me->id, 'type' => 'like', 'channel' => 'push',
        ])->count());
    }

    public function test_save_preferences_rejects_unknown_type_or_channel(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/notifications/preferences', [
            'preferences' => [['type' => 'unknown', 'channel' => 'push', 'enabled' => true]],
        ])->assertStatus(422);

        $this->postJson('/api/v1/notifications/preferences', [
            'preferences' => [['type' => 'like', 'channel' => 'fax', 'enabled' => true]],
        ])->assertStatus(422);
    }

    public function test_onboarding_complete_persists_profile_and_follows_and_flips_flag(): void
    {
        $me = User::factory()->create(['onboarding_completed' => false]);
        $a = User::factory()->create();
        $b = User::factory()->create();

        Sanctum::actingAs($me);

        $this->postJson('/api/v1/onboarding/complete', [
            'food_preferences' => ['italian', 'thai'],
            'dietary_restrictions' => ['vegetarian'],
            'location' => 'Bangalore',
            'follow_user_ids' => [$a->id, $b->id],
        ])->assertOk()
            ->assertJsonPath('data.onboarding_completed', true);

        $this->assertTrue($me->fresh()->onboarding_completed);
        $this->assertSame(['italian', 'thai'], $me->profile()->first()->food_preferences);
        $this->assertDatabaseHas('follows', ['follower_id' => $me->id, 'following_id' => $a->id]);
        $this->assertDatabaseHas('follows', ['follower_id' => $me->id, 'following_id' => $b->id]);
    }

    public function test_onboarding_skip_just_flips_the_flag(): void
    {
        $me = User::factory()->create(['onboarding_completed' => false]);
        Sanctum::actingAs($me);

        $this->postJson('/api/v1/onboarding/skip')->assertOk()->assertJsonPath('data.onboarding_completed', true);
        $this->assertTrue($me->fresh()->onboarding_completed);
    }

    public function test_me_payload_exposes_onboarding_completed(): void
    {
        $me = User::factory()->create(['onboarding_completed' => true]);
        Sanctum::actingAs($me);

        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.onboarding_completed', true);
    }
}
