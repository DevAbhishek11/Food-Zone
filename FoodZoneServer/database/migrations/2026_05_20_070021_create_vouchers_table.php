<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            // null vendor_id => platform-wide promo (admin)
            $table->foreignId('vendor_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('code', 40)->unique();
            $table->string('description')->nullable();
            $table->string('type', 20)->default('percentage'); // percentage | flat
            $table->decimal('amount', 10, 2); // percent value or flat amount
            $table->decimal('max_discount', 10, 2)->nullable(); // cap for percentage
            $table->decimal('min_order', 10, 2)->default(0);
            $table->unsignedInteger('max_uses')->nullable(); // global limit
            $table->unsignedInteger('per_user_limit')->default(1);
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('stackable')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_to')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'valid_to']);
        });

        // Note: orders.voucher_id is a plain indexed column (no DB-level FK) to
        // keep the schema portable across MySQL and SQLite. Integrity is
        // enforced at the application layer via the Order/Voucher relationship.
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
