<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\VendorStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesOwnedVendor;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderRatingResource;
use App\Models\OrderRating;
use App\Models\Vendor;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use ResolvesOwnedVendor;

    /** Public, paginated reviews for a vendor (newest first). */
    public function index(string $idOrSlug): JsonResponse
    {
        $vendor = Vendor::where('status', VendorStatus::Approved->value)
            ->where(fn ($q) => $q->where('slug', $idOrSlug)->orWhere('id', (int) $idOrSlug))
            ->firstOrFail();

        $reviews = $vendor->ratings()
            ->with('user.profile')
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($reviews, OrderRatingResource::class, 'Reviews loaded.');
    }

    /** Reviews received by the authenticated vendor. */
    public function vendorIndex(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $reviews = $vendor->ratings()
            ->with('user.profile')
            ->when($request->boolean('unanswered'), fn ($q) => $q->whereNull('vendor_reply'))
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated($reviews, OrderRatingResource::class, 'Vendor reviews loaded.');
    }

    /** Vendor (owner) replies to a review on their store. */
    public function reply(Request $request, OrderRating $rating, NotificationService $notifications): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        if ($rating->vendor_id !== $vendor->id) {
            abort(403, 'This review is not for your store.');
        }

        $data = $request->validate([
            'reply' => ['required', 'string', 'min:1', 'max:1000'],
        ]);

        $rating->update([
            'vendor_reply' => $data['reply'],
            'vendor_replied_at' => now(),
        ]);

        $notifications->notify(
            $rating->user_id,
            'review_reply',
            'Vendor replied to your review',
            "{$vendor->name} responded to your review.",
            ['vendor_id' => $vendor->id, 'rating_id' => $rating->id],
        );

        return ApiResponse::success(
            new OrderRatingResource($rating->fresh()->load('user.profile')),
            'Reply posted.'
        );
    }
}
