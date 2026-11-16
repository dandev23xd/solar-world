<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('category', 30);
            $table->decimal('price', 10, 2);
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->string('image_url')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('stock')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};