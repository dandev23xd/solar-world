<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'product_id',
        'qty',
        'sale_date',
        'channel',
        'est_delivery',
        'status',
    ];

    protected $casts = [
        'qty' => 'integer',
    ];

    protected static function booted()
    {
        static::addGlobalScope('active', fn (Builder $query) => $query->where('sales.status', '!=', 'Cancelled'));
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class);
    }
}