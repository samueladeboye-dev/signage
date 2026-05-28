<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('screens', function (Blueprint $table): void {
            $table->string('orientation')->default('landscape')->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('screens', function (Blueprint $table): void {
            $table->dropColumn('orientation');
        });
    }
};
