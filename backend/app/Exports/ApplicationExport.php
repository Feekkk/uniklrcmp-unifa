<?php

namespace App\Exports;

use App\Models\Application;
use Illuminate\Support\Collection;

class ApplicationExport
{
    protected $applications;
    protected $filters;

    public function __construct($applications, $filters = [])
    {
        $this->applications = $applications;
        $this->filters = $filters;
    }

    /**
     * Generate CSV content for applications
     */
    public function toCsv(): string
    {
        $csv = '';
        
        // Add BOM for proper UTF-8 encoding in Excel
        $csv .= "\xEF\xBB\xBF";
        
        // Add headers
        $headers = [
            'Application ID',
            'Student Name',
            'Student ID',
            'Email',
            'Phone Number',
            'Program',
            'Semester',
            'Application Status',
            'Amount Requested (RM)',
            'Approved Amount (RM)',
            'Purpose',
            'Justification',
            'Fund Category',
            'Fund Sub Category',
            'Submitted Date',
            'Admin Reviewed Date',
            'Committee Reviewed Date',
            'Admin Comments',
            'Committee Comments',
            'Admin Name',
            'Committee Name',
            'Contact Number',
            'Emergency Contact',
            'Updated Date'
        ];
        
        $csv .= $this->arrayToCsv($headers);
        
        // Add data rows
        foreach ($this->applications as $application) {
            $row = [
                $application->applicationId,
                $application->user ? $application->user->fullName : 'N/A',
                $application->studentId ?? 'N/A',
                $application->user ? $application->user->email : 'N/A',
                $application->user ? $application->user->phoneNo : 'N/A',
                $application->user ? $application->user->program : 'N/A',
                $application->user ? $application->user->semester : 'N/A',
                $this->getStatusLabel($application->applicationStatus),
                number_format($application->amountRequested, 2),
                $application->approvedAmount ? number_format($application->approvedAmount, 2) : 'N/A',
                $application->purpose ?? 'N/A',
                $application->justification ?? 'N/A',
                $application->fundCategory ?? 'N/A',
                $application->fundSubCategory ?? 'N/A',
                $application->submittedAt ? $application->submittedAt->format('Y-m-d H:i:s') : 'N/A',
                $application->adminReviewedAt ? $application->adminReviewedAt->format('Y-m-d H:i:s') : 'N/A',
                $application->committeeReviewedAt ? $application->committeeReviewedAt->format('Y-m-d H:i:s') : 'N/A',
                $application->adminComments ?? 'N/A',
                $application->committeeComments ?? 'N/A',
                $application->admin ? $application->admin->name : 'N/A',
                $application->committee ? $application->committee->name : 'N/A',
                $application->contactNumber ?? 'N/A',
                $application->emergencyContact ?? 'N/A',
                $application->updatedAt ? $application->updatedAt->format('Y-m-d H:i:s') : 'N/A'
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
        
        return $filename . '.csv';
    }

    /**
     * Get title for the export
     */
    public function getTitle(): string
    {
        $title = 'Student Applications';
        
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
     * Get summary statistics
     */
    public function getSummary(): array
    {
        $total = $this->applications->count();
        $statusCounts = $this->applications->groupBy('applicationStatus')->map->count();
        $totalAmountRequested = $this->applications->sum('amountRequested');
        $totalAmountApproved = $this->applications->whereNotNull('approvedAmount')->sum('approvedAmount');

        return [
            'total_applications' => $total,
            'status_counts' => $statusCounts,
            'total_amount_requested' => $totalAmountRequested,
            'total_amount_approved' => $totalAmountApproved,
            'approval_rate' => $total > 0 ? ($statusCounts['approved'] ?? 0) / $total * 100 : 0
        ];
    }
}
