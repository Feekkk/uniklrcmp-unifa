<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $table = 'applications';
    protected $primaryKey = 'applicationId';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'applicationId',
        'userId',
        'categoryId',
        'formId',
        'formData',
        'amountRequested',
        'purpose',
        'justification',
        'applicationStatus',
        'submittedAt',
        'updatedAt',
        'adminId',
        'committeeId',
        'adminReviewedAt',
        'committeeReviewedAt',
        'adminComments',
        'committeeComments',
        'approvedAmount',
        'fundCategory',
        'fundSubCategory',
        'bereavementType',
        'deathCertificatePath',
        'clinicName',
        'reasonVisit',
        'visitDateTime',
        'totalAmountOutpatient',
        'receiptClinicPath',
        'reasonVisitInpatient',
        'checkInDate',
        'checkOutDate',
        'totalAmountInpatient',
        'hospitalDocumentsPath',
        'totalAmountInjuries',
        'injuryDocumentsPath',
        'totalAmountCriticalIllness',
        'criticalIllnessDocumentsPath',
        'naturalDisasterCase',
        'totalAmountNaturalDisaster',
        'naturalDisasterDocumentsPath',
        'othersCase',
        'totalAmountOthers',
        'othersDocumentsPath',
        'studentId',
        'course',
        'semester',
        'contactNumber',
        'emergencyContact'
    ];

    protected $casts = [
        'submittedAt' => 'datetime',
        'updatedAt' => 'datetime',
        'adminReviewedAt' => 'datetime',
        'committeeReviewedAt' => 'datetime',
        'amountRequested' => 'decimal:2',
        'approvedAmount' => 'decimal:2',
        'formData' => 'array',
        'visitDateTime' => 'datetime',
        'checkInDate' => 'date',
        'checkOutDate' => 'date',
        'totalAmountOutpatient' => 'decimal:2',
        'totalAmountInpatient' => 'decimal:2',
        'totalAmountInjuries' => 'decimal:2',
        'totalAmountCriticalIllness' => 'decimal:2',
        'totalAmountNaturalDisaster' => 'decimal:2',
        'totalAmountOthers' => 'decimal:2'
    ];

    protected $appends = ['id'];

    /**
     * Get the id attribute - alias for applicationId
     */
    public function getIdAttribute()
    {
        return $this->applicationId;
    }

    /**
     * Get the status attribute - alias for applicationStatus
     */
    public function getStatusAttribute()
    {
        return $this->attributes['applicationStatus'] ?? null;
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function category()
    {
        return $this->belongsTo(FundingCategory::class, 'categoryId', 'categoryId');
    }

    // Alias expected by controllers: fundingCategory
    public function fundingCategory()
    {
        return $this->belongsTo(FundingCategory::class, 'categoryId', 'categoryId');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'adminId');
    }

    public function committee()
    {
        return $this->belongsTo(Committee::class, 'committeeId');
    }

    public function documents()
    {
        return $this->hasMany(ApplicationDocument::class, 'applicationId', 'applicationId');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'applicationId', 'applicationId');
    }

    public function approvalWorkflows()
    {
        return $this->hasMany(ApprovalWorkflow::class, 'applicationId', 'applicationId');
    }

    public function statusLogs()
    {
        return $this->hasMany(ApplicationStatusLog::class, 'applicationId', 'applicationId');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'applicationId', 'applicationId');
    }
}