<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundingCategory extends Model
{
    protected $table = 'funding_categories';
    protected $primaryKey = 'categoryId';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'categoryId',
        'categoryName',
        'description',
        'maxAmount',
        'eligibilityCriteria',
        'status'
    ];

    // Relationship with applications
    public function applications()
    {
        return $this->hasMany(Application::class, 'categoryId', 'categoryId');
    }
}