<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50); // spam | harassment | order_abuse | ...
            $table->text('evidence')->nullable();
            $table->string('severity', 20)->default('low'); // low | medium | high | severe
            $table->unsignedTinyInteger('warning_number')->default(1); // 1..3
            // status: open | acknowledged | suspended | banned | pardoned
            $table->string('status', 20)->default('open');
            $table->nullableMorphs('subject'); // optional: post/comment that triggered it
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('violation_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained()->cascadeOnDelete();
            $table->string('action_type', 40); // warning | suspend | ban | pardon | dm
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('violation_actions');
        Schema::dropIfExists('violations');
    }
};
