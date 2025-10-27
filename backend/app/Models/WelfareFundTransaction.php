<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WelfareFundTransaction extends Model
{
    protected $table = 'welfare_fund_transactions';
    protected $primaryKey = 'transactionId';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'transactionId',
        'type',
        'amount',
        'category',
        'description',
        'receipt_number',
        'processed_by',
        'application_id',
        'balance_after',
        'remarks',
        'metadata'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'application_id', 'applicationId');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by', 'id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'processed_by', 'id');
    }

    // Scopes
    public function scopeInflow($query)
    {
        return $query->where('type', 'inflow');
    }

    public function scopeOutflow($query)
    {
        return $query->where('type', 'outflow');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByMonth($query, $month, $year = null)
    {
        $year = $year ?? date('Y');
        return $query->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month);
    }

    public function scopeByYear($query, $year = null)
    {
        $year = $year ?? date('Y');
        return $query->whereYear('created_at', $year);
    }

    // Helper methods
    public static function getCurrentBalance(): float
    {
        $latestTransaction = static::latest()->first();
        return $latestTransaction ? (float) $latestTransaction->balance_after : 0.0;
    }

    public static function createTransaction(array $data): self
    {
        $currentBalance = static::getCurrentBalance();
        $amount = (float) $data['amount'];
        
        // Calculate new balance based on transaction type
        $newBalance = $data['type'] === 'inflow' 
            ? $currentBalance + $amount
            : $currentBalance - $amount;

        // Generate transaction ID
        $transactionId = 'TXN-' . date('Ymd') . '-' . strtoupper(uniqid());

        $data['transactionId'] = $transactionId;
        $data['balance_after'] = $newBalance;

        return static::create($data);
    }
}
