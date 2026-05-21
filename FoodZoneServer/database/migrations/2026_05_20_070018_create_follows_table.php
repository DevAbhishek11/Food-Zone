<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('following_id')->constrained('users')->cascadeOnDelete();
            // status: accepted | pending (for private accounts)
            $table->string('status', 20)->default('accepted');
            $table->timestamps();

            $table->unique(['follower_id', 'following_id']);
            $table->index(['following_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follows');
    }
};
