<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderRating;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private function deliveredOrder(Vendor $vendor, User $customer): Order
    {
        return Order::create([
            'order_number' => 'FZ-REV-'.uniqid(),
            'user_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered->value,
            'subtotal' => 100, 'total' => 100,
            'payment_method' => 'cod', 'payment_status' => 'paid',
        ]);
    }

    public function test_public_can_list_vendor_reviews(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendor, $customer);
        OrderRating::create([
            'order_id' => $order->id, 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'rating' => 5, 'review' => 'Fantastic food and quick delivery!',
        ]);

        $this->getJson("/api/v1/vendors/{$vendor->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 5)
            ->assertJsonPath('data.0.user.username', $customer->username);
    }

    public function test_vendor_can_reply_to_a_review_on_their_store(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendor, $customer);
        $rating = OrderRating::create([
            'order_id' => $order->id, 'user_id' => $customer->id, 'vendor_id' => $vendor->id,
            'rating' => 4, 'review' => 'Pretty good overall, will order again.',
        ]);

        Sanctum::actingAs($vendor->user);
        $this->postJson("/api/v1/vendor/reviews/{$rating->id}/reply", ['reply' => 'Thank you so much!'])
            ->assertOk()
            ->assertJsonPath('data.vendor_reply', 'Thank you so much!');

        $this->assertNotNull($rating->fresh()->vendor_replied_at);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => 'review_reply',
        ]);
    }

    public function test_vendor_cannot_reply_to_another_stores_review(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendorB, $customer);
        $rating = OrderRating::create([
            'order_id' => $order->id, 'user_id' => $customer->id, 'vendor_id' => $vendorB->id,
            'rating' => 3, 'review' => 'It was okay, nothing special really.',
        ]);

        Sanctum::actingAs($vendorA->user);
        $this->postJson("/api/v1/vendor/reviews/{$rating->id}/reply", ['reply' => 'Hijack'])
            ->assertStatus(403);
    }

    public function test_rating_a_delivered_order_then_appears_in_vendor_reviews(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendor, $customer);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/rate", [
            'rating' => 5,
            'review' => 'Genuinely the best biryani in town!',
        ])->assertCreated();

        $this->getJson("/api/v1/vendors/{$vendor->slug}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.review', 'Genuinely the best biryani in town!');
    }

    public function test_rating_with_photos_stores_and_returns_them(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendor, $customer);
        $photos = ['https://cdn.example.test/a.jpg', 'https://cdn.example.test/b.jpg'];

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/rate", [
            'rating' => 5,
            'review' => 'Loved it, photos attached below for proof!',
            'images' => $photos,
        ])->assertCreated();

        $this->getJson("/api/v1/vendors/{$vendor->slug}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.images', $photos);
    }

    public function test_rating_photos_are_capped_at_five(): void
    {
        $vendor = Vendor::factory()->create();
        $customer = User::factory()->create();
        $order = $this->deliveredOrder($vendor, $customer);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/orders/{$order->id}/rate", [
            'rating' => 4,
            'images' => array_map(fn ($i) => "https://cdn.example.test/{$i}.jpg", range(1, 6)),
        ])->assertStatus(422);
    }
}
