<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });

        // Nullable: null = the default "Saved" bucket (existing behaviour).
        Schema::table('saved_posts', function (Blueprint $table) {
            $table->foreignId('collection_id')->nullable()->after('post_id')
                ->constrained('saved_collections')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('saved_posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('collection_id');
        });
        Schema::dropIfExists('saved_collections');
    }
};
