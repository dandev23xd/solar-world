<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marketing extends Model
{
    protected $table = 'marketing';

    public $timestamps = false;

    protected $fillable = [
        'channel',
        'campaign',
        'spend',
        'leads',
        'start_date',
    ];

    protected $casts = [
        'spend' => 'float',
        'leads' => 'integer',
    ];
}