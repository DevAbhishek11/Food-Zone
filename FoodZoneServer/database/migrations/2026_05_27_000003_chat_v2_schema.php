<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_muted')->default(false);
            $table->timestamp('muted_until')->nullable();
        });

        Schema::table('messages', function (Blueprint $table) {
            // Plain indexed column (no FK so the ALTER runs on SQLite); app-enforced.
            $table->unsignedBigInteger('replied_to_message_id')->nullable()->index();
            $table->string('type', 20)->default('text'); // text | image | voice | file
            $table->string('media_url')->nullable();
            $table->softDeletes(); // deleted_at for self-delete "This message was deleted"
        });

        Schema::create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 8);
            $table->timestamps();

            $table->unique(['message_id', 'user_id', 'emoji']);
            $table->index('message_id');
        });

        Schema::create('starred_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('starred_messages');
        Schema::dropIfExists('message_reactions');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['replied_to_message_id', 'type', 'media_url']);
        });

        Schema::table('conversation_user', function (Blueprint $table) {
            $table->dropColumn(['is_pinned', 'is_muted', 'muted_until']);
        });
    }
};
