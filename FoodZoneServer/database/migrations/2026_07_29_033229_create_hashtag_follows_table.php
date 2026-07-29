<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Hashtags aren't a modelled entity (they're extracted from post
        // bodies on the fly — see HashtagController::trending), so a follow
        // is keyed on the lowercased tag string, not a foreign id.
        Schema::create('hashtag_follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('tag', 100);
            $table->timestamps();
            $table->unique(['user_id', 'tag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hashtag_follows');
    }
};
