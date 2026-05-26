<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Plain indexed column (no DB-level FK) so the ALTER runs on both
            // MySQL and SQLite — integrity is enforced at the app layer, same as
            // voucher_id. Points at users.id (a delivery-role user).
            $table->unsignedBigInteger('delivery_partner_id')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();

            $table->index('delivery_partner_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['delivery_partner_id']);
            $table->dropColumn(['delivery_partner_id', 'assigned_at', 'picked_up_at']);
        });
    }
};
