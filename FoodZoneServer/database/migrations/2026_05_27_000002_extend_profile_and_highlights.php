<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->index();
        });

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('location', 100)->nullable();
        });

        Schema::create('story_highlights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('cover_url')->nullable();
            // Plain JSON list of story ids (app-enforced membership; stories may expire/delete).
            $table->json('story_ids');
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('story_highlights');
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn('location');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_verified']);
            $table->dropColumn('is_verified');
        });
    }
};
