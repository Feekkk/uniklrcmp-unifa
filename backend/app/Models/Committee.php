<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Committee extends Authenticatable implements JWTSubject
{
    protected $table = 'committees';
    protected $fillable = ['name', 'username', 'email', 'password'];

    public $timestamps = true;

    // Add virtual attributes
    protected $appends = ['role', 'fullName'];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => 'committee',
            'email' => $this->email,
            'guard' => 'committee'
        ];
    }

    /**
     * Get the guard that should be used for JWT authentication.
     */
    public function getAuthGuard()
    {
        return 'committee';
    }

    /**
     * Get the role attribute.
     */
    public function getRoleAttribute()
    {
        return 'committee';
    }

    /**
     * Get the full name attribute.
     */
    public function getFullNameAttribute()
    {
        return $this->username ?? 'Committee Member';
    }
}
