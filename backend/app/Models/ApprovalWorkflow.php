<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalWorkflow extends Model
{
    protected $table = 'approval_workflows';
    protected $primaryKey = 'workflowId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'workflowId',
        'applicationId',
        'approverType',
        'approverId',
        'previousStatus',
        'newStatus',
        'comments',
        'reviewedAt',
        'decision'
    ];

    protected $casts = [
        'reviewedAt' => 'datetime'
    ];

    public function application()
    {
        return $this->belongsTo(Application::class, 'applicationId', 'applicationId');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'approverId')->where('approverType', 'admin');
    }

    public function committee()
    {
        return $this->belongsTo(Committee::class, 'approverId')->where('approverType', 'committee');
    }
}