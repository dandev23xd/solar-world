<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('qty')->default(1);
            $table->date('sale_date');
            $table->string('channel', 30)->default('Website');
            $table->date('est_delivery')->nullable();
            $table->string('status', 20)->default('Pending');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};