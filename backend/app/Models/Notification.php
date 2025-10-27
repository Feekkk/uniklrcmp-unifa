<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'notificationId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'notificationId',
        'userId',
        'applicationId',
        'title',
        'message',
        'type',
        'isRead',
        'createdAt',
        'readAt'
    ];

    protected $casts = [
        'isRead' => 'boolean',
        'createdAt' => 'datetime',
        'readAt' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function application()
    {
        return $this->belongsTo(Application::class, 'applicationId', 'applicationId');
    }
}