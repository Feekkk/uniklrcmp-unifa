<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Admin extends Authenticatable implements JWTSubject
{
    use HasFactory;
    
    protected $table = 'admins';
    protected $fillable = [
        'username',
        'email',
        'password',
        'name'
    ];

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
            'role' => 'admin',
            'email' => $this->email
        ];
    }

    /**
     * Get the role attribute.
     */
    public function getRoleAttribute()
    {
        return 'admin';
    }

    /**
     * Get the full name attribute.
     */
    public function getFullNameAttribute()
    {
        return $this->name ?: 'Administrator';
    }
}
