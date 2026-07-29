<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Set on account-deletion request; the account is deactivated
            // immediately, then permanently purged 30 days later by the
            // users:purge-deleted scheduled command (spec §8.2, §22.4)
            // unless the user logs back in and reactivates before then.
            $table->timestamp('deletion_requested_at')->nullable()->after('deactivated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('deletion_requested_at');
        });
    }
};
