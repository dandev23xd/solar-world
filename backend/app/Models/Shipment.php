<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    protected static function booted()
    {
        static::addGlobalScope('active', fn (Builder $query) => $query->where('shipments.status', '!=', 'Cancelled'));
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}