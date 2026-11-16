<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('region', 20)->nullable();
            $table->string('type', 20)->default('Residential');
            $table->date('joined')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('address')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};