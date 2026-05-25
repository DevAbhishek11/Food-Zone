<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MenuCategoryController;
use App\Http\Controllers\Api\V1\MenuItemController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /* ---------------------------------------------------------------- Health */
    Route::prefix('health')->group(function () {
        Route::get('/', [HealthController::class, 'index']);
        Route::get('/database', fn () => response()->json(app(HealthController::class)->database()));
        Route::get('/cache', fn () => response()->json(app(HealthController::class)->cache()));
        Route::get('/queue', fn () => response()->json(app(HealthController::class)->queue()));
        Route::get('/storage', fn () => response()->json(app(HealthController::class)->storage()));
    });

    /* ------------------------------------------------------------------ Auth */
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('verify-email', [AuthController::class, 'verifyEmail']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);

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
        Route::get('posts/{post}', [PostController::class, 'show']);
        Route::get('posts/{post}/comments', [CommentController::class, 'index']);

        Route::get('vendors', [VendorController::class, 'index']);
        Route::get('vendors/{idOrSlug}', [VendorController::class, 'show']);
        Route::get('vendors/{idOrSlug}/menu', [VendorController::class, 'menu']);
        Route::get('vendors/{idOrSlug}/reviews', [ReviewController::class, 'index']);

        Route::get('users/{username}', [UserController::class, 'show']);
        Route::get('users/{username}/posts', [UserController::class, 'posts']);
        Route::get('users/{user}/followers', [UserController::class, 'followers']);
        Route::get('users/{user}/following', [UserController::class, 'following']);
    });

    /* ----------------------------------------------------- Authenticated API */
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        // Media uploads
        Route::post('media', [\App\Http\Controllers\Api\V1\MediaController::class, 'store']);

        // Account & profile
        Route::put('profile', [ProfileController::class, 'update']);
        Route::post('profile/deactivate', [ProfileController::class, 'deactivate']);
        Route::apiResource('addresses', AddressController::class)->only(['index', 'store', 'update', 'destroy']);

        // Social — feed & posts
        Route::get('feed', [PostController::class, 'feed']);
        Route::post('posts', [PostController::class, 'store']);
        Route::put('posts/{post}', [PostController::class, 'update']);
        Route::delete('posts/{post}', [PostController::class, 'destroy']);
        Route::post('posts/{post}/like', [PostController::class, 'like']);
        Route::delete('posts/{post}/like', [PostController::class, 'unlike']);
        Route::post('posts/{post}/comments', [CommentController::class, 'store']);
        Route::delete('comments/{comment}', [CommentController::class, 'destroy']);

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

        // Orders (customers)
        Route::middleware('role:user,admin')->group(function () {
            Route::post('orders', [OrderController::class, 'store']);
            Route::post('orders/{order}/reorder', [OrderController::class, 'reorder']);
        });
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::post('orders/{order}/rate', [OrderController::class, 'rate']);

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
        });

        // Admin
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard']);
            Route::get('analytics', [AdminController::class, 'analytics']);
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
