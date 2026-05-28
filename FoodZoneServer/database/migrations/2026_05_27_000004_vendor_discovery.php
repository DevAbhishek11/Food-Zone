<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            // Cuisine/category tags as a JSON list (e.g. ["Indian","Fast Food"]).
            $table->json('tags')->nullable();
        });

        Schema::create('vendor_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 100);
            $table->text('detail')->nullable();
            $table->string('status', 20)->default('open')->index(); // open | reviewed | dismissed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_reports');
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
    }
};
