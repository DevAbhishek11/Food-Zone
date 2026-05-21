<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 32)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('address_id')->nullable()->constrained('user_addresses')->nullOnDelete();

            // status: pending | accepted | preparing | ready | out_for_delivery | delivered | cancelled | rejected
            $table->string('status', 24)->default('pending')->index();

            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('delivery_charge', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('commission', 10, 2)->default(0);

            $table->string('payment_method', 20)->default('cod'); // cod | upi | card | wallet | netbanking
            $table->string('payment_status', 20)->default('pending'); // pending | paid | refunded | failed

            // FK to vouchers added in the vouchers migration (created afterwards)
            $table->foreignId('voucher_id')->nullable()->index();
            $table->string('notes')->nullable();
            $table->string('cancellation_reason')->nullable();

            // snapshot of delivery address
            $table->json('delivery_address')->nullable();

            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['vendor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
