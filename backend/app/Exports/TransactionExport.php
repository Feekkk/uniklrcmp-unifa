<?php

namespace App\Exports;

use App\Models\WelfareFundTransaction;
use Illuminate\Support\Collection;

class TransactionExport
{
    protected $transactions;
    protected $filters;

    public function __construct($transactions, $filters = [])
    {
        $this->transactions = $transactions;
        $this->filters = $filters;
    }

    /**
     * Generate CSV content for transactions
     */
    public function toCsv(): string
    {
        $csv = '';
        
        // Add BOM for proper UTF-8 encoding in Excel
        $csv .= "\xEF\xBB\xBF";
        
        // Add headers
        $headers = [
            'Transaction ID',
            'Type',
            'Amount (RM)',
            'Category',
            'Description',
            'Receipt Number',
            'Processed By',
            'Application ID',
            'Balance After (RM)',
            'Remarks',
            'Transaction Date',
            'Created At',
            'Updated At'
        ];
        
        $csv .= $this->arrayToCsv($headers);
        
        // Add data rows
        foreach ($this->transactions as $transaction) {
            $row = [
                $transaction->transactionId,
                ucfirst($transaction->type),
                number_format($transaction->amount, 2),
                $transaction->category,
                $transaction->description,
                $transaction->receipt_number ?? 'N/A',
                $transaction->processor ? $transaction->processor->name : 'N/A',
                $transaction->application_id ?? 'N/A',
                number_format($transaction->balance_after, 2),
                $transaction->remarks ?? 'N/A',
                $transaction->created_at->format('Y-m-d'),
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->updated_at->format('Y-m-d H:i:s'),
            ];
            
            $csv .= $this->arrayToCsv($row);
        }
        
        return $csv;
    }

    /**
     * Convert array to CSV row
     */
    private function arrayToCsv(array $data): string
    {
        $csv = '';
        foreach ($data as $index => $field) {
            if ($index > 0) {
                $csv .= ',';
            }
            
            // Escape field if it contains comma, quote, or newline
            if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
                $field = '"' . str_replace('"', '""', $field) . '"';
            }
            
            $csv .= $field;
        }
        
        $csv .= "\n";
        return $csv;
    }

    /**
     * Get filename for export
     */
    public function getFilename(): string
    {
        $filename = 'welfare_fund_transactions_' . date('Y-m-d_H-i-s');
        
        if (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $filename .= '_' . $this->filters['start_date'] . '_to_' . $this->filters['end_date'];
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $filename .= '_' . $this->filters['year'] . '-' . str_pad($this->filters['month'], 2, '0', STR_PAD_LEFT);
        } elseif (isset($this->filters['year'])) {
            $filename .= '_' . $this->filters['year'];
        }
        
        return $filename . '.csv';
    }

    /**
     * Get title for the export
     */
    public function getTitle(): string
    {
        $title = 'Welfare Fund Transactions';
        
        if (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $title .= ' (' . $this->filters['start_date'] . ' to ' . $this->filters['end_date'] . ')';
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['month'] . '/' . $this->filters['year'] . ')';
        } elseif (isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['year'] . ')';
        }

        return $title;
    }
}