<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 255)->nullable();
            $table->timestamps();
            $table->unique(['vendor_id', 'user_id']);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('unit', 20)->default('unit'); // unit | kg | g | l | ml | pack
            $table->decimal('stock', 12, 3)->default(0);
            $table->decimal('threshold', 12, 3)->default(0); // low-stock alert level
            $table->timestamps();
            $table->index('vendor_id');
        });

        Schema::create('flash_deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            // Plain indexed col (no FK) — keeps the migration portable on SQLite ALTER paths.
            $table->unsignedBigInteger('item_id');
            $table->unsignedTinyInteger('discount_percent'); // 1..90
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->unsignedInteger('quantity_limit')->nullable();
            $table->unsignedInteger('claimed_count')->default(0);
            $table->timestamps();

            $table->index(['vendor_id', 'ends_at']);
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flash_deals');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('vendor_user_blocks');
    }
};
