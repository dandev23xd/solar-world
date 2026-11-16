<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'customer_id',
        'locked',
        'lock_reason',
        'unlock_request',
        'unlock_requested_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
        'locked' => 'boolean',
        'unlock_requested_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function lockMessage(): string
    {
        $message = 'Your account has been locked.';

        if ($this->lock_reason) {
            $message .= ' Reason: ' . $this->lock_reason . '.';
        }

        if ($this->unlock_request) {
            $message .= ' Your unlock request is waiting for review.';
        }

        return $message;
    }
}