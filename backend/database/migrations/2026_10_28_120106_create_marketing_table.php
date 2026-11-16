<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing', function (Blueprint $table) {
            $table->id();
            $table->string('channel', 30);
            $table->string('campaign', 60);
            $table->decimal('spend', 10, 2)->default(0);
            $table->unsignedInteger('leads')->default(0);
            $table->date('start_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing');
    }
};