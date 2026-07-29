<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Set when payment_method = 'wallet' (always equals `total` today —
            // wallet is a full-payment method, not a partial top-up, matching
            // the existing payment_method enum). Kept as its own column rather
            // than inferred so refunds/reporting don't need to re-derive it.
            $table->decimal('wallet_amount', 10, 2)->default(0)->after('commission');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('wallet_amount');
        });
    }
};
