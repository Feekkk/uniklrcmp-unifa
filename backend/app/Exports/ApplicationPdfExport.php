<?php

namespace App\Exports;

use App\Models\Application;
use Illuminate\Support\Collection;

class ApplicationPdfExport
{
    protected $applications;
    protected $filters;
    protected $summary;

    public function __construct($applications, $filters = [])
    {
        $this->applications = $applications;
        $this->filters = $filters;
        $this->calculateSummary();
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummary()
    {
        $this->summary = [
            'total_applications' => $this->applications->count(),
            'pending' => $this->applications->where('applicationStatus', 'pending')->count(),
            'approved' => $this->applications->where('applicationStatus', 'approved')->count(),
            'rejected' => $this->applications->where('applicationStatus', 'rejected')->count(),
            'under_review' => $this->applications->where('applicationStatus', 'under_review')->count(),
            'need_receipt' => $this->applications->where('applicationStatus', 'need_receipt')->count(),
            'completed' => $this->applications->where('applicationStatus', 'completed')->count(),
            'total_amount_requested' => $this->applications->sum('amountRequested'),
            'total_amount_approved' => $this->applications->whereNotNull('approvedAmount')->sum('approvedAmount'),
            'approval_rate' => $this->applications->count() > 0 ? 
                ($this->applications->where('applicationStatus', 'approved')->count() / $this->applications->count()) * 100 : 0
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
            \Log::error('Error generating HTML for application PDF: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get filename for export
     */
    public function getFilename(): string
    {
        $filename = 'student_applications_' . date('Y-m-d_H-i-s');
        
        // Handle time-based export options
        if (isset($this->filters['export_period'])) {
            $period = $this->filters['export_period'];
            switch ($period) {
                case '1_month':
                    $filename .= '_1_month';
                    break;
                case '3_months':
                    $filename .= '_3_months';
                    break;
                case '1_year':
                    $filename .= '_1_year';
                    break;
            }
        } elseif (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $filename .= '_' . $this->filters['start_date'] . '_to_' . $this->filters['end_date'];
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $filename .= '_' . $this->filters['year'] . '-' . str_pad($this->filters['month'], 2, '0', STR_PAD_LEFT);
        } elseif (isset($this->filters['year'])) {
            $filename .= '_' . $this->filters['year'];
        }
        
        if (isset($this->filters['status'])) {
            $filename .= '_' . $this->filters['status'];
        }
        
        return $filename . '.pdf';
    }

    /**
     * Get title for the export
     */
    public function getTitle(): string
    {
        $title = 'Student Applications Report';
        
        // Handle time-based export options
        if (isset($this->filters['export_period'])) {
            $period = $this->filters['export_period'];
            switch ($period) {
                case '1_month':
                    $title .= ' (Last 1 Month)';
                    break;
                case '3_months':
                    $title .= ' (Last 3 Months)';
                    break;
                case '1_year':
                    $title .= ' (Last 1 Year)';
                    break;
            }
        } elseif (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $title .= ' (' . $this->filters['start_date'] . ' to ' . $this->filters['end_date'] . ')';
        } elseif (isset($this->filters['month']) && isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['month'] . '/' . $this->filters['year'] . ')';
        } elseif (isset($this->filters['year'])) {
            $title .= ' (' . $this->filters['year'] . ')';
        }

        if (isset($this->filters['status'])) {
            $title .= ' - ' . $this->getStatusLabel($this->filters['status']);
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
                .status-pending { color: #ffc107; }
                .status-approved { color: #28a745; }
                .status-rejected { color: #dc3545; }
                .status-under-review { color: #17a2b8; }
                .status-completed { color: #6f42c1; }
                .amount { color: #007bff; }
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
                .status {
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 10px;
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
                .page-break {
                    page-break-before: always;
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

            ' . $this->getApplicationsTableHtml() . '

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
                    <div class="summary-value">' . number_format($this->summary['total_applications']) . '</div>
                    <div class="summary-label">Total Applications</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value status-pending">' . number_format($this->summary['pending']) . '</div>
                    <div class="summary-label">Pending</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value status-approved">' . number_format($this->summary['approved']) . '</div>
                    <div class="summary-label">Approved</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value status-rejected">' . number_format($this->summary['rejected']) . '</div>
                    <div class="summary-label">Rejected</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value amount">RM ' . number_format($this->summary['total_amount_requested'], 2) . '</div>
                    <div class="summary-label">Total Requested</div>
                </div>
            </div>
            <div class="summary-grid" style="margin-top: 15px;">
                <div class="summary-item">
                    <div class="summary-value amount">RM ' . number_format($this->summary['total_amount_approved'], 2) . '</div>
                    <div class="summary-label">Total Approved</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">' . number_format($this->summary['approval_rate'], 1) . '%</div>
                    <div class="summary-label">Approval Rate</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value status-under-review">' . number_format($this->summary['under_review']) . '</div>
                    <div class="summary-label">Under Review</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value status-completed">' . number_format($this->summary['completed']) . '</div>
                    <div class="summary-label">Completed</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">' . number_format($this->summary['need_receipt']) . '</div>
                    <div class="summary-label">Need Receipt</div>
                </div>
            </div>
        </div>';
    }

    /**
     * Get applications table HTML
     */
    private function getApplicationsTableHtml(): string
    {
        if ($this->applications->isEmpty()) {
            return '<div class="no-data">No applications found for the selected criteria.</div>';
        }

        $html = '
        <table class="table">
            <thead>
                <tr>
                    <th>Application ID</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Amount Requested</th>
                    <th>Amount Approved</th>
                    <th>Fund Category</th>
                    <th>Submitted Date</th>
                    <th>Reviewed By</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($this->applications as $application) {
            $statusClass = $this->getStatusClass($application->applicationStatus);
            $statusText = $this->getStatusLabel($application->applicationStatus);
            
            $html .= '
                <tr>
                    <td>' . htmlspecialchars($application->applicationId) . '</td>
                    <td>' . htmlspecialchars($application->user ? $application->user->fullName : 'N/A') . '</td>
                    <td>' . htmlspecialchars($application->studentId ?? 'N/A') . '</td>
                    <td>' . htmlspecialchars($application->user ? $application->user->program : 'N/A') . '</td>
                    <td><span class="status ' . $statusClass . '">' . $statusText . '</span></td>
                    <td class="amount">RM ' . number_format($application->amountRequested, 2) . '</td>
                    <td class="amount">' . ($application->approvedAmount ? 'RM ' . number_format($application->approvedAmount, 2) : 'N/A') . '</td>
                    <td>' . htmlspecialchars($application->fundCategory ?? 'N/A') . '</td>
                    <td>' . ($application->submittedAt ? $application->submittedAt->format('M j, Y') : 'N/A') . '</td>
                    <td>' . htmlspecialchars($application->admin ? $application->admin->name : ($application->committee ? $application->committee->name : 'N/A')) . '</td>
                </tr>';
        }

        $html .= '
            </tbody>
        </table>';

        return $html;
    }

    /**
     * Get status class for styling
     */
    private function getStatusClass($status): string
    {
        $statusClasses = [
            'pending' => 'status-pending',
            'approved' => 'status-approved',
            'rejected' => 'status-rejected',
            'under_review' => 'status-under-review',
            'need_receipt' => 'status-pending',
            'completed' => 'status-completed',
            'cancelled' => 'status-rejected'
        ];

        return $statusClasses[$status] ?? 'status-pending';
    }

    /**
     * Get status label for display
     */
    private function getStatusLabel($status): string
    {
        $statusLabels = [
            'pending' => 'Pending',
            'under_review' => 'Under Review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'need_receipt' => 'Need Receipt',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled'
        ];

        return $statusLabels[$status] ?? ucfirst($status);
    }

    /**
     * Get date range text
     */
    private function getDateRangeText(): string
    {
        // Handle time-based export options
        if (isset($this->filters['export_period'])) {
            $period = $this->filters['export_period'];
            switch ($period) {
                case '1_month':
                    return 'Last 1 Month';
                case '3_months':
                    return 'Last 3 Months';
                case '1_year':
                    return 'Last 1 Year';
            }
        } elseif (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
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
