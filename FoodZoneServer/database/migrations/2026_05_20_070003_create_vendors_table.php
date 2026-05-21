<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();

            // Registration / KYC
            $table->string('business_license')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email')->nullable();

            // Location & service area
            $table->string('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->decimal('radius_km', 6, 2)->default(5);

            // Operations
            // status: pending | approved | rejected | suspended
            $table->string('status', 20)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_open')->default(true);
            $table->string('closed_message')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(5.00);
            $table->decimal('min_order_value', 10, 2)->default(0);
            $table->boolean('delivery_enabled')->default(true);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('free_delivery_above', 10, 2)->nullable();
            $table->unsignedInteger('prep_time_minutes')->default(30);
            $table->boolean('cod_enabled')->default(true);
            $table->boolean('is_featured')->default(false);

            // Denormalized rating
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedBigInteger('rating_count')->default(0);
            $table->unsignedBigInteger('orders_count')->default(0);

            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'is_open']);
            $table->index('city');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
