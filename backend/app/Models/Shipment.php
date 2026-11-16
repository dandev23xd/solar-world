<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sale_id',
        'region',
        'cost',
        'days',
        'status',
    ];

    protected $casts = [
        'cost' => 'float',
        'days' => 'integer',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}