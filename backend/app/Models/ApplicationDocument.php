<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationDocument extends Model
{
    protected $table = 'application_documents';
    protected $primaryKey = 'documentId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'documentId',
        'applicationId',
        'uploadedBy',
        'fileName',
        'filePath',
        'fileType',
        'fileSize',
        'documentType',
        'uploadedAt',
        'description',
        'status'
    ];

    protected $casts = [
        'uploadedAt' => 'datetime',
        'fileSize' => 'decimal:2'
    ];

    protected $appends = ['id'];

    /**
     * Get the id attribute - alias for documentId
     */
    public function getIdAttribute()
    {
        return $this->documentId;
    }

    public function application()
    {
        return $this->belongsTo(Application::class, 'applicationId', 'applicationId');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploadedBy');
    }
}