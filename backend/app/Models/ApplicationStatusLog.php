<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationStatusLog extends Model
{
    protected $table = 'application_status_logs';
    protected $primaryKey = 'logId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'logId',
        'applicationId',
        'previousStatus',
        'newStatus',
        'changedBy',
        'changedAt',
        'remarks'
    ];

    protected $casts = [
        'changedAt' => 'datetime'
    ];

    public function application()
    {
        return $this->belongsTo(Application::class, 'applicationId', 'applicationId');
    }

    public function changer()
    {
        // This could be either an admin or committee member
        return $this->belongsTo(User::class, 'changedBy');
    }
}