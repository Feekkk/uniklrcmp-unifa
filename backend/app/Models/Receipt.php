<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $table = 'receipts';
    protected $primaryKey = 'receiptId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'receiptId',
        'applicationId',
        'uploadedBy',
        'fileName',
        'originalFileName',
        'filePath',
        'fileType',
        'fileSize',
        'uploadedAt',
        'description',
        'status'
    ];

    protected $casts = [
        'uploadedAt' => 'datetime',
        'fileSize' => 'decimal:2'
    ];

    public function application()
    {
        return $this->belongsTo(Application::class, 'applicationId', 'applicationId');
    }

    public function uploader()
    {
        return $this->belongsTo(Admin::class, 'uploadedBy');
    }
}