<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Signed: positive = credit, negative = debit. balance_after makes
            // the ledger self-auditing without replaying every prior row.
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_after', 10, 2);
            // type: order_payment | order_refund | loyalty_redemption | admin_credit | admin_debit
            $table->string('type', 32);
            $table->nullableMorphs('reference');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
