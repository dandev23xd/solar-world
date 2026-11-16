<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'region',
        'type',
        'joined',
        'phone',
        'address',
    ];

    public function user()
    {
        return $this->hasOne(User::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}