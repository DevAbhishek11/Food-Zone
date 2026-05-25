<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Events\NotificationCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RealtimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_liking_a_post_broadcasts_a_notification(): void
    {
        Event::fake([NotificationCreated::class]);

        $author = User::factory()->create();
        $post = Post::factory()->for($author)->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/posts/{$post->id}/like")->assertOk();

        Event::assertDispatched(NotificationCreated::class, fn ($e) => $e->notification->user_id === $author->id);
    }

    public function test_advancing_order_status_broadcasts(): void
    {
        Event::fake([OrderStatusUpdated::class]);

        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'FZ-RT1', 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'status' => OrderStatus::Pending->value, 'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'pending',
        ]);

        Sanctum::actingAs($vendor->user);
        $this->postJson("/api/v1/vendor/orders/{$order->id}/status", ['status' => 'accepted'])->assertOk();

        Event::assertDispatched(OrderStatusUpdated::class, fn ($e) => $e->orderId === $order->id && $e->status === 'accepted');
    }

    public function test_events_target_the_expected_private_channels(): void
    {
        $orderEvent = new OrderStatusUpdated(5, 9, 'preparing', 'FZ-9');
        $channels = collect($orderEvent->broadcastOn())->map(fn ($c) => $c->name)->all();
        $this->assertContains('private-order.5', $channels);
        $this->assertContains('private-user.9', $channels);
        $this->assertSame('order.status', $orderEvent->broadcastAs());

        $user = User::factory()->create();
        $notification = $user->notifications()->create(['type' => 'system', 'title' => 'Hi']);
        $event = new NotificationCreated($notification);
        $this->assertSame('private-user.'.$user->id, $event->broadcastOn()->name);
        $this->assertSame('notification.created', $event->broadcastAs());
    }
}
