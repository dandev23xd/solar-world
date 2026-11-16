<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('unlock_request')->nullable()->after('lock_reason');
            $table->timestamp('unlock_requested_at')->nullable()->after('unlock_request');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['unlock_request', 'unlock_requested_at']);
        });
    }
};