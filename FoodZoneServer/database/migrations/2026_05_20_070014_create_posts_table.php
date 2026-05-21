<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body')->nullable();
            // privacy: public | followers | private
            $table->string('privacy', 20)->default('public');
            // type: text | image | video | poll | shared
            $table->string('type', 20)->default('text');

            // optional tags
            $table->foreignId('tagged_vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->foreignId('tagged_item_id')->nullable()->constrained('menu_items')->nullOnDelete();
            $table->string('location')->nullable();

            // repost reference
            $table->foreignId('shared_post_id')->nullable()->constrained('posts')->nullOnDelete();

            $table->boolean('is_pinned')->default(false);

            // denormalized counters
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedBigInteger('comments_count')->default(0);
            $table->unsignedBigInteger('shares_count')->default(0);

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['privacy', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
