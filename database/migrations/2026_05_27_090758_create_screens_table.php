<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('screens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('created_by')->index();
            $table->foreignId('current_playlist_id')->nullable()->index();
            $table->string('name');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->string('pairing_code', 8)->unique();
            $table->string('status')->default(\App\Enums\ScreenStatus::Offline->value);
            $table->timestamp('last_seen_at')->nullable();
            $table->string('timezone')->default('UTC');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screens');
    }
};
