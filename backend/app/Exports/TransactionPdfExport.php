<?php

namespace App\Exports;

use App\Models\WelfareFundTransaction;
use Illuminate\Support\Collection;

class TransactionPdfExport
{
    protected $transactions;
    protected $filters;
    protected $summary;

    public function __construct($transactions, $filters = [])
    {
        $this->transactions = $transactions;
        $this->filters = $filters;
        $this->calculateSummary();
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummary()
    {
        $this->summary = [
            'total_transactions' => $this->transactions->count(),
            'total_inflow' => $this->transactions->where('type', 'inflow')->sum('amount'),
            'total_outflow' => $this->transactions->where('type', 'outflow')->sum('amount'),
            'net_flow' => $this->transactions->where('type', 'inflow')->sum('amount') - $this->transactions->where('type', 'outflow')->sum('amount'),
            'current_balance' => $this->transactions->isNotEmpty() ? $this->transactions->last()->balance_after : 0,
        ];
    }

    /**
     * Generate HTML content for PDF
     */
    public function toHtml(): string
    {
        try {
            $html = $this->getHtmlTemplate();
            return $html;
        } catch (\Exception $e) {
            \Log::error('Error generating HTML for PDF: ' . $e->getMessage());
            throw $e;
        }
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
        
        return $filename . '.pdf';
    }

    /**
     * Get title for the export
     */
    public function getTitle(): string
    {
        $title = 'Welfare Fund Transactions Report';
        
        if (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $title .= ' (' . $this->filters['start_date'] . ' to ' . $this->filters['end_date'] . ')';
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['month'] . '/' . $this->filters['year'] . ')';
        } elseif (isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['year'] . ')';
        }

        return $title;
    }

    /**
     * Get HTML template for PDF
     */
    private function getHtmlTemplate(): string
    {
        $title = $this->getTitle();
        $dateRange = $this->getDateRangeText();
        $logoBase64 = $this->getLogoBase64();
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>' . htmlspecialchars($title) . '</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #2c3e50;
                    padding-bottom: 20px;
                }
                .header-logo {
                    margin-bottom: 15px;
                }
                .header-logo img {
                    height: 80px;
                    width: auto;
                }
                .header h1 {
                    color: #2c3e50;
                    margin: 0;
                    font-size: 24px;
                }
                .header h2 {
                    color: #7f8c8d;
                    margin: 5px 0 0 0;
                    font-size: 16px;
                    font-weight: normal;
                }
                .summary {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                .summary h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 16px;
                }
                .summary-grid {
                    display: table;
                    width: 100%;
                }
                .summary-item {
                    display: table-cell;
                    width: 20%;
                    text-align: center;
                    padding: 10px;
                    border-right: 1px solid #dee2e6;
                }
                .summary-item:last-child {
                    border-right: none;
                }
                .summary-value {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .summary-label {
                    font-size: 11px;
                    color: #6c757d;
                    margin-top: 5px;
                }
                .inflow { color: #28a745; }
                .outflow { color: #dc3545; }
                .balance { color: #007bff; }
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .table th {
                    background-color: #2c3e50;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 11px;
                }
                .table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #dee2e6;
                    font-size: 11px;
                }
                .table tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .table tr:hover {
                    background-color: #e9ecef;
                }
                .amount {
                    text-align: right;
                    font-weight: bold;
                }
                .type-inflow {
                    color: #28a745;
                    font-weight: bold;
                }
                .type-outflow {
                    color: #dc3545;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #6c757d;
                    border-top: 1px solid #dee2e6;
                    padding-top: 15px;
                }
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="header">
                ' . ($logoBase64 ? '<div class="header-logo"><img src="' . $logoBase64 . '" alt="UniKL RCMP Logo" /></div>' : '') . '
                <h1>UniKL RCMP Finance Aids System</h1>
                <h2>' . htmlspecialchars($title) . '</h2>
                <p>Generated on ' . date('F j, Y \a\t g:i A') . '</p>
            </div>

            ' . $this->getSummaryHtml() . '

            ' . $this->getTransactionsTableHtml() . '

            <div class="footer">
                <p>This report was generated automatically by the UniKL Finance Aids System</p>
                <p>For questions or support, please contact the Finance Aids System administrator</p>
            </div>
        </body>
        </html>';

        return $html;
    }

    /**
     * Get summary HTML
     */
    private function getSummaryHtml(): string
    {
        return '
        <div class="summary">
            <h3>Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">' . number_format($this->summary['total_transactions']) . '</div>
                    <div class="summary-label">Total Transactions</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value inflow">RM ' . number_format($this->summary['total_inflow'], 2) . '</div>
                    <div class="summary-label">Total Inflow</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value outflow">RM ' . number_format($this->summary['total_outflow'], 2) . '</div>
                    <div class="summary-label">Total Outflow</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value ' . ($this->summary['net_flow'] >= 0 ? 'inflow' : 'outflow') . '">RM ' . number_format($this->summary['net_flow'], 2) . '</div>
                    <div class="summary-label">Net Flow</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value balance">RM ' . number_format($this->summary['current_balance'], 2) . '</div>
                    <div class="summary-label">Current Balance</div>
                </div>
            </div>
        </div>';
    }

    /**
     * Get transactions table HTML
     */
    private function getTransactionsTableHtml(): string
    {
        if ($this->transactions->isEmpty()) {
            return '<div class="no-data">No transactions found for the selected criteria.</div>';
        }

        $html = '
        <table class="table">
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Receipt No.</th>
                    <th>Processed By</th>
                    <th>Date</th>
                    <th>Balance After</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($this->transactions as $transaction) {
            $typeClass = $transaction->type === 'inflow' ? 'type-inflow' : 'type-outflow';
            $typeText = ucfirst($transaction->type);
            
            $html .= '
                <tr>
                    <td>' . htmlspecialchars($transaction->transactionId) . '</td>
                    <td><span class="' . $typeClass . '">' . $typeText . '</span></td>
                    <td class="amount">RM ' . number_format($transaction->amount, 2) . '</td>
                    <td>' . htmlspecialchars($transaction->category) . '</td>
                    <td>' . htmlspecialchars($transaction->description) . '</td>
                    <td>' . htmlspecialchars($transaction->receipt_number ?? 'N/A') . '</td>
                    <td>' . htmlspecialchars($transaction->processor ? $transaction->processor->name : 'N/A') . '</td>
                    <td>' . $transaction->created_at->format('M j, Y') . '</td>
                    <td class="amount">RM ' . number_format($transaction->balance_after, 2) . '</td>
                </tr>';
        }

        $html .= '
            </tbody>
        </table>';

        return $html;
    }

    /**
     * Get date range text
     */
    private function getDateRangeText(): string
    {
        if (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            return $this->filters['start_date'] . ' to ' . $this->filters['end_date'];
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $monthName = date('F', mktime(0, 0, 0, $this->filters['month'], 1));
            return $monthName . ' ' . $this->filters['year'];
        } elseif (isset($this->filters['year'])) {
            return $this->filters['year'];
        }
        
        return 'All Time';
    }

    /**
     * Get logo as base64 encoded string
     */
    private function getLogoBase64(): string
    {
        try {
            // Check if GD extension is available - DomPDF needs it to process images
            if (!extension_loaded('gd')) {
                \Log::info('GD extension not available, skipping logo to avoid DomPDF errors');
                return '';
            }
            
            $logoPath = public_path('unikl-rcmp.png');
            
            if (!file_exists($logoPath)) {
                \Log::warning('Logo file not found at: ' . $logoPath);
                return '';
            }
            
            $imageData = file_get_contents($logoPath);
            if ($imageData === false) {
                \Log::error('Failed to read logo file: ' . $logoPath);
                return '';
            }
            
            $mimeType = mime_content_type($logoPath);
            if ($mimeType === false) {
                \Log::error('Failed to get MIME type for logo file: ' . $logoPath);
                return '';
            }
            
            return 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
        } catch (\Exception $e) {
            \Log::error('Error processing logo: ' . $e->getMessage());
            return '';
        }
    }
}
