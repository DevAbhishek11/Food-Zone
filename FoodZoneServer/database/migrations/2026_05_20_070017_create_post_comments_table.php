<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('post_comments')->cascadeOnDelete();
            $table->text('body');
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedBigInteger('replies_count')->default(0);
            $table->timestamps();

            $table->index(['post_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_comments');
    }
};
