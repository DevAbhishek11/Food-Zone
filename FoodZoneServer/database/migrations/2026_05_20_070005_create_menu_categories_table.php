<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            // status: approved | pending | rejected (admin moderation of vendor categories)
            $table->string('status', 20)->default('approved');
            $table->timestamps();

            $table->index(['vendor_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_categories');
    }
};
