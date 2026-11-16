<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'category',
        'price',
        'unit_cost',
        'image_url',
        'description',
        'stock',
    ];

    protected $casts = [
        'price' => 'float',
        'unit_cost' => 'float',
        'stock' => 'integer',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}