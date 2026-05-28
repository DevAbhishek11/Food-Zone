<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\HashtagController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MenuCategoryController;
use App\Http\Controllers\Api\V1\MenuItemController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\StoryController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function () {

    /* ---------------------------------------------------------------- Health */
    Route::prefix('health')->group(function () {
        Route::get('/', [HealthController::class, 'index']);
        Route::get('/database', fn () => response()->json(app(HealthController::class)->database()));
        Route::get('/cache', fn () => response()->json(app(HealthController::class)->cache()));
        Route::get('/queue', fn () => response()->json(app(HealthController::class)->queue()));
        Route::get('/storage', fn () => response()->json(app(HealthController::class)->storage()));
    });

    /* --------------------------------------------------- Payments (webhook) */
    // Public: gateways call this server-to-server; authenticity is verified by
    // signature inside the controller (no user session).
    Route::post('payments/webhook', [\App\Http\Controllers\Api\V1\PaymentController::class, 'webhook']);

    /* ------------------------------------------------------------------ Auth */
    Route::prefix('auth')->group(function () {
        // Stricter per-IP throttle on unauthenticated credential endpoints.
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register']);
            Route::post('login', [AuthController::class, 'login']);
            Route::post('verify-email', [AuthController::class, 'verifyEmail']);
            Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
            Route::post('reset-password', [AuthController::class, 'resetPassword']);
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::post('resend-verification', [AuthController::class, 'resendVerification']);
        });
    });

    /* ----------------------------------------------- Public (optional auth) */
    Route::middleware('auth.optional')->group(function () {
        Route::get('search', [SearchController::class, 'index']);
        Route::get('explore', [PostController::class, 'explore']);

        // Discovery (registered before posts/{post} so "trending" isn't treated as an id).
        Route::get('posts/trending', [PostController::class, 'trending']);
        Route::get('hashtags/trending', [HashtagController::class, 'trending']);
        Route::get('hashtags/{tag}/posts', [HashtagController::class, 'posts']);

        Route::get('posts/{post}', [PostController::class, 'show']);
        Route::get('posts/{post}/comments', [CommentController::class, 'index']);
        Route::get('posts/{post}/liked-by', [PostController::class, 'likedBy']);
        Route::get('posts/{post}/shares', [PostController::class, 'shares']);

        Route::get('vendors', [VendorController::class, 'index']);
        // Discovery — registered before /vendors/{idOrSlug} so 'nearby' isn't treated as a slug.
        Route::get('vendors/nearby', [VendorController::class, 'nearby']);
        Route::get('items/trending', [VendorController::class, 'itemsTrending']);
        Route::get('vendors/{idOrSlug}', [VendorController::class, 'show']);
        Route::get('vendors/{idOrSlug}/menu', [VendorController::class, 'menu']);
        Route::get('vendors/{idOrSlug}/reviews', [ReviewController::class, 'index']);

        Route::get('users/{username}', [UserController::class, 'show']);
        Route::get('users/{username}/posts', [UserController::class, 'posts']);
        Route::get('users/{username}/food-journey', [UserController::class, 'foodJourney']);
        Route::get('users/{username}/tagged-in', [UserController::class, 'taggedIn']);
        Route::get('users/{username}/highlights', [\App\Http\Controllers\Api\V1\StoryHighlightController::class, 'index']);
        Route::get('users/{user}/followers', [UserController::class, 'followers']);
        Route::get('users/{user}/following', [UserController::class, 'following']);
    });

    /* ----------------------------------------------------- Authenticated API */
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        // Media uploads
        Route::post('media', [\App\Http\Controllers\Api\V1\MediaController::class, 'store']);

        // Push notification device tokens
        Route::post('push-tokens', [\App\Http\Controllers\Api\V1\PushTokenController::class, 'store']);
        Route::delete('push-tokens', [\App\Http\Controllers\Api\V1\PushTokenController::class, 'destroy']);

        // Account & profile
        Route::put('profile', [ProfileController::class, 'update']);
        Route::post('profile/deactivate', [ProfileController::class, 'deactivate']);
        Route::apiResource('addresses', AddressController::class)->only(['index', 'store', 'update', 'destroy']);

        // Social — feed & posts
        Route::get('feed', [PostController::class, 'feed']);
        Route::get('feed/suggested', [PostController::class, 'suggested']);
        Route::get('saved', [PostController::class, 'saved']);
        Route::post('posts', [PostController::class, 'store']);
        Route::put('posts/{post}', [PostController::class, 'update']);
        Route::delete('posts/{post}', [PostController::class, 'destroy']);
        Route::post('posts/{post}/like', [PostController::class, 'like']);
        Route::delete('posts/{post}/like', [PostController::class, 'unlike']);
        Route::post('posts/{post}/save', [PostController::class, 'save']);
        Route::delete('posts/{post}/save', [PostController::class, 'unsave']);
        Route::post('posts/{post}/share', [PostController::class, 'share']);
        Route::post('posts/{post}/comments', [CommentController::class, 'store']);
        Route::delete('comments/{comment}', [CommentController::class, 'destroy']);

        // Stories
        Route::get('stories', [StoryController::class, 'index']);
        Route::post('stories', [StoryController::class, 'store']);
        Route::delete('stories/{story}', [StoryController::class, 'destroy']);
        Route::post('stories/{story}/view', [StoryController::class, 'view']);
        Route::get('stories/{story}/views', [StoryController::class, 'views']);

        // Story highlights (own management)
        Route::post('story-highlights', [\App\Http\Controllers\Api\V1\StoryHighlightController::class, 'store']);
        Route::delete('story-highlights/{highlight}', [\App\Http\Controllers\Api\V1\StoryHighlightController::class, 'destroy']);

        // Follow graph
        Route::post('users/{user}/follow', [UserController::class, 'follow']);
        Route::delete('users/{user}/follow', [UserController::class, 'unfollow']);
        Route::post('users/{user}/block', [UserController::class, 'block']);
        Route::delete('users/{user}/block', [UserController::class, 'unblock']);

        // Chat / DMs
        Route::get('conversations', [\App\Http\Controllers\Api\V1\ChatController::class, 'index']);
        Route::post('conversations', [\App\Http\Controllers\Api\V1\ChatController::class, 'store']);
        Route::get('conversations/unread-count', [\App\Http\Controllers\Api\V1\ChatController::class, 'unreadCount']);
        Route::get('conversations/{conversation}/messages', [\App\Http\Controllers\Api\V1\ChatController::class, 'messages']);
        Route::post('conversations/{conversation}/messages', [\App\Http\Controllers\Api\V1\ChatController::class, 'send']);
        Route::post('conversations/{conversation}/read', [\App\Http\Controllers\Api\V1\ChatController::class, 'markRead']);
        // Chat v2 actions
        Route::put('conversations/{conversation}/pin', [\App\Http\Controllers\Api\V1\ChatController::class, 'pin']);
        Route::put('conversations/{conversation}/mute', [\App\Http\Controllers\Api\V1\ChatController::class, 'mute']);
        Route::post('conversations/{conversation}/typing', [\App\Http\Controllers\Api\V1\ChatController::class, 'typing']);
        Route::get('conversations/{conversation}/search', [\App\Http\Controllers\Api\V1\ChatController::class, 'search']);
        Route::get('conversations/{conversation}/starred', [\App\Http\Controllers\Api\V1\ChatController::class, 'starred']);
        Route::post('conversations/{conversation}/forward', [\App\Http\Controllers\Api\V1\ChatController::class, 'forward']);
        Route::delete('messages/{message}', [\App\Http\Controllers\Api\V1\ChatController::class, 'deleteMessage']);
        Route::post('messages/{message}/react', [\App\Http\Controllers\Api\V1\ChatController::class, 'react']);
        Route::post('messages/{message}/star', [\App\Http\Controllers\Api\V1\ChatController::class, 'star']);
        Route::delete('messages/{message}/star', [\App\Http\Controllers\Api\V1\ChatController::class, 'unstar']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
        Route::delete('notifications', [NotificationController::class, 'clearAll']);

        // Favorites
        Route::get('favorites', [VendorController::class, 'favorites']);
        Route::post('vendors/{vendor}/favorite', [VendorController::class, 'favorite']);
        Route::delete('vendors/{vendor}/favorite', [VendorController::class, 'unfavorite']);
        Route::post('vendors/{vendor}/report', [VendorController::class, 'report']);

        // Checkout — price the cart (variants/add-ons + voucher) before placing.
        Route::post('checkout/quote', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'quote']);

        // Orders (customers)
        Route::middleware('role:user,admin')->group(function () {
            Route::post('orders', [OrderController::class, 'store']);
            Route::post('orders/{order}/reorder', [OrderController::class, 'reorder']);
        });
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::post('orders/{order}/rate', [OrderController::class, 'rate']);

        // Payments — create an intent for an online order, then confirm (mock) /
        // the gateway calls the public webhook above.
        Route::post('orders/{order}/pay', [\App\Http\Controllers\Api\V1\PaymentController::class, 'pay']);
        Route::post('payments/{payment}/confirm', [\App\Http\Controllers\Api\V1\PaymentController::class, 'confirm']);

        // Delivery partner self-service
        Route::post('delivery/register', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'register']);
        Route::prefix('delivery')->middleware('role:delivery,admin')->group(function () {
            Route::get('available', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'available']);
            Route::get('orders', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'myOrders']);
            Route::get('stats', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'stats']);
            Route::post('orders/{order}/accept', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'accept']);
            Route::post('orders/{order}/release', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'release']);
            Route::post('orders/{order}/pick-up', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'pickUp']);
            Route::post('orders/{order}/deliver', [\App\Http\Controllers\Api\V1\DeliveryController::class, 'deliver']);
        });

        // Vendor self-service
        Route::post('vendors/register', [VendorController::class, 'register']);
        Route::prefix('vendor')->group(function () {
            Route::get('me', [VendorController::class, 'mine']);
            Route::get('stats', [VendorController::class, 'stats']);
            Route::get('analytics', [VendorController::class, 'analytics']);
            Route::get('hours', [VendorController::class, 'hours']);
            Route::put('hours', [VendorController::class, 'updateHours']);
            Route::put('store', [VendorController::class, 'update']);
            Route::post('store/toggle-open', [VendorController::class, 'toggleOpen']);
            Route::apiResource('categories', MenuCategoryController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('items', MenuItemController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::post('items/{item}/toggle-availability', [MenuItemController::class, 'toggleAvailability']);
            Route::get('orders', [OrderController::class, 'vendorIndex']);
            Route::post('orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::get('reviews', [ReviewController::class, 'vendorIndex']);
            Route::post('reviews/{rating}/reply', [ReviewController::class, 'reply']);

            // ---- P31 Vendor Dashboard v3 ----
            Route::get('customers', [VendorController::class, 'customers']);
            Route::post('customers/{userId}/warn', [VendorController::class, 'warnCustomer']);
            Route::post('customers/{userId}/block', [VendorController::class, 'blockCustomer']);
            Route::delete('customers/{userId}/block', [VendorController::class, 'unblockCustomer']);

            Route::get('inventory', [VendorController::class, 'inventory']);
            Route::post('inventory', [VendorController::class, 'inventoryStore']);
            Route::put('inventory/{item}', [VendorController::class, 'inventoryUpdate']);
            Route::delete('inventory/{item}', [VendorController::class, 'inventoryDestroy']);
            Route::post('inventory/{item}/adjust', [VendorController::class, 'inventoryAdjust']);

            Route::get('vouchers', [VendorController::class, 'vouchersIndex']);
            Route::post('vouchers', [VendorController::class, 'vouchersStore']);
            Route::put('vouchers/{voucher}', [VendorController::class, 'vouchersUpdate']);
            Route::delete('vouchers/{voucher}', [VendorController::class, 'vouchersDestroy']);

            Route::get('analytics/items', [VendorController::class, 'itemsAnalytics']);
            Route::get('payouts', [VendorController::class, 'payouts']);
            Route::post('flash-deals', [VendorController::class, 'flashDealCreate']);
        });

        // Admin
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard']);
            Route::get('analytics', [AdminController::class, 'analytics']);
            Route::get('audit-logs', [AdminController::class, 'auditLogs']);
            Route::get('orders', [AdminController::class, 'orders']);
            Route::post('users/bulk', [AdminController::class, 'bulkUsers']);
            Route::get('users', [AdminController::class, 'users']);
            Route::put('users/{user}/ban', [AdminController::class, 'banUser']);
            Route::put('users/{user}/suspend', [AdminController::class, 'suspendUser']);
            Route::put('users/{user}/unban', [AdminController::class, 'unbanUser']);
            Route::get('vendors', [AdminController::class, 'vendors']);
            Route::put('vendors/{vendor}/approve', [AdminController::class, 'approveVendor']);
            Route::put('vendors/{vendor}/reject', [AdminController::class, 'rejectVendor']);
        });
    });
});
