<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Violation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminConsoleV3Test extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_report_a_post(): void
    {
        $post = Post::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/posts/{$post->id}/report", ['reason' => 'spam', 'detail' => 'Repeated promo spam'])
            ->assertCreated();

        $this->assertDatabaseHas('violations', [
            'user_id' => $post->user_id,
            'subject_type' => Post::class,
            'subject_id' => $post->id,
        ]);
    }

    public function test_admin_lists_violations(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $offender = User::factory()->create();
        Violation::create(['user_id' => $offender->id, 'type' => 'spam', 'status' => 'open']);

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/violations')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'spam');
    }

    public function test_resolve_warn_sends_system_notification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $offender = User::factory()->create();
        $v = Violation::create(['user_id' => $offender->id, 'type' => 'spam', 'status' => 'open']);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/admin/violations/{$v->id}/action", ['action_type' => 'warn', 'notes' => 'Stop the spam.'])
            ->assertOk();

        $this->assertEquals('resolved', $v->fresh()->status);
        $this->assertDatabaseHas('notifications', ['user_id' => $offender->id, 'type' => 'system']);
        $this->assertDatabaseHas('violation_actions', ['violation_id' => $v->id, 'action_type' => 'warn']);
    }

    public function test_resolve_suspend_sets_user_status_and_clears_tokens(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $offender = User::factory()->create();
        Sanctum::actingAs($offender);
        $token = $offender->createToken('test')->plainTextToken;
        $v = Violation::create(['user_id' => $offender->id, 'type' => 'spam', 'status' => 'open']);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/admin/violations/{$v->id}/action", ['action_type' => 'suspend', 'days' => 7])
            ->assertOk();

        $this->assertEquals('suspended', $offender->fresh()->status->value);
        $this->assertEquals(0, $offender->tokens()->count());
    }

    public function test_resolve_remove_content_deletes_subject(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $post = Post::factory()->create();
        $v = Violation::create([
            'user_id' => $post->user_id, 'type' => 'spam', 'status' => 'open',
            'subject_type' => Post::class, 'subject_id' => $post->id,
        ]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/admin/violations/{$v->id}/action", ['action_type' => 'remove_content'])
            ->assertOk();

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_revenue_breakdown_aggregates_delivered_orders(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $vendor = Vendor::factory()->create();
        Order::create([
            'order_number' => 'FZ-R-1', 'user_id' => User::factory()->create()->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value, 'subtotal' => 1000, 'total' => 1100, 'commission' => 100,
            'payment_method' => 'upi', 'payment_status' => 'paid',
        ]);

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/revenue')
            ->assertOk()
            ->assertJsonPath('data.gross', 1100)
            ->assertJsonPath('data.net', 1000)
            ->assertJsonPath('data.top_vendors.0.vendor_id', $vendor->id);
    }

    public function test_feature_vendor_toggles_flag(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $vendor = Vendor::factory()->create(['is_featured' => false]);

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/admin/vendors/{$vendor->id}/feature")
            ->assertOk()
            ->assertJsonPath('data.is_featured', true);

        $this->putJson("/api/v1/admin/vendors/{$vendor->id}/feature")
            ->assertOk()
            ->assertJsonPath('data.is_featured', false);
    }

    public function test_broadcast_notifies_targeted_segment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(2)->create(['role' => 'user']);
        User::factory()->create(['role' => 'vendor']);

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/admin/broadcast', [
            'title' => 'Heads up', 'message' => 'New feature live.', 'segment' => 'users',
        ])->assertOk()->assertJsonPath('data.recipients', 2);

        $this->assertEquals(2, \App\Models\Notification::where('type', 'system')->count());
    }
}
