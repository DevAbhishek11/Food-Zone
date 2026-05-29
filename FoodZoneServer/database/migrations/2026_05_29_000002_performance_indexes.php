<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P35 performance — composite indexes covering the hot scan paths added
 * over P25-P34 (trending vendors, paginated orders/notifications, follow
 * graph lookups, paginated comments). Each one matches a specific query
 * the existing code already runs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Trending vendors (P33) + admin/vendor revenue windows.
            $table->index(['vendor_id', 'created_at'], 'orders_vendor_id_created_at_index');
            // Paginated order history for a customer.
            $table->index(['user_id', 'created_at'], 'orders_user_id_created_at_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // Grouped notifications query (P34) — buckets + recency-ordered list.
            $table->index(['user_id', 'created_at'], 'notifications_user_id_created_at_index');
        });

        Schema::table('follows', function (Blueprint $table) {
            // "Who am I following" lookups (feed, suggested users).
            $table->index(['follower_id', 'status'], 'follows_follower_id_status_index');
        });

        Schema::table('post_comments', function (Blueprint $table) {
            // Paginated comment scroll on a post.
            $table->index(['post_id', 'created_at'], 'post_comments_post_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_vendor_id_created_at_index');
            $table->dropIndex('orders_user_id_created_at_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_id_created_at_index');
        });

        Schema::table('follows', function (Blueprint $table) {
            $table->dropIndex('follows_follower_id_status_index');
        });

        Schema::table('post_comments', function (Blueprint $table) {
            $table->dropIndex('post_comments_post_id_created_at_index');
        });
    }
};
