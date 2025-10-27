<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\ApiController;
use App\Models\WelfareFundTransaction;
use App\Models\Application;
use App\Models\User;
use App\Models\Admin;
use App\Exports\TransactionExport;
use App\Exports\TransactionPdfExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class FinanceController extends ApiController
{
    /**
     * Authenticate admin user via email (fallback authentication)
     */
    private function authenticateAdminByEmail(Request $request)
    {
        $email = $request->get('email') ?? $request->header('X-Admin-Email');
        
        \Log::info('Attempting email-based admin authentication', [
            'email' => $email,
            'email_from_param' => $request->get('email'),
            'email_from_header' => $request->header('X-Admin-Email')
        ]);
        
        if (!$email) {
            \Log::warning('No admin email found in request');
            return null;
        }
        
        $admin = Admin::where('email', $email)->first();
        if ($admin) {
            \Log::info('Admin found via email', ['admin_id' => $admin->id, 'email' => $admin->email]);
            
            // Store admin info in request for use in controller methods
            $request->merge(['authenticated_admin' => $admin]);
            return $admin;
        }
        
        \Log::warning('Admin not found for email', ['email' => $email]);
        return null;
    }

    /**
     * Helper method to update the current balance
     */
    private function updateCurrentBalance(): void
    {
        try {
            DB::transaction(function () {
                // Lock the balance record for update to prevent race conditions
                $balanceRecord = DB::table('welfare_fund_balance')
                    ->where('id', 1)
                    ->lockForUpdate()
                    ->first();

                // Calculate total inflow and outflow using a single query
                $totals = DB::select("
                    SELECT 
                        COALESCE(SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END), 0) as total_inflow,
                        COALESCE(SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END), 0) as total_outflow
                    FROM welfare_fund_transactions
                ")[0];
                
                $currentBalance = $totals->total_inflow - $totals->total_outflow;
                
                // Get the authenticated user ID or fallback to the last processor
                $lastUpdatedBy = auth()->id();
                if (!$lastUpdatedBy) {
                    $lastTransaction = WelfareFundTransaction::latest()->first();
                    $lastUpdatedBy = $lastTransaction ? $lastTransaction->processed_by : 'System';
                }
                
                // Update or create the balance record
                DB::table('welfare_fund_balance')->updateOrInsert(
                    ['id' => 1],
                    [
                        'current_balance' => $currentBalance,
                        'last_updated' => now(),
                        'last_updated_by' => $lastUpdatedBy,
                        'updated_at' => now()
                    ]
                );

                \Log::info('Successfully updated welfare fund balance', [
                    'previous_balance' => $balanceRecord ? $balanceRecord->current_balance : 0,
                    'new_balance' => $currentBalance,
                    'total_inflow' => $totals->total_inflow,
                    'total_outflow' => $totals->total_outflow,
                    'updated_by' => $lastUpdatedBy
                ]);
            });
        } catch (\Exception $e) {
            \Log::error('Failed to update current balance: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get current welfare fund balance
     */
    public function getCurrentBalance(): JsonResponse
    {
        try {
            $balanceRecord = DB::table('welfare_fund_balance')
                ->where('id', 1)
                ->first();

            if (!$balanceRecord) {
                // If no balance record exists, calculate and create it
                $this->updateCurrentBalance();
                $balanceRecord = DB::table('welfare_fund_balance')
                    ->where('id', 1)
                    ->first();
            }
            
            return $this->successResponse([
                'current_balance' => $balanceRecord->current_balance,
                'last_updated' => $balanceRecord->last_updated,
                'last_updated_by' => $balanceRecord->last_updated_by
            ], 'Current welfare fund balance retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve current balance: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve current balance: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Get all welfare fund transactions
     */
    public function getTransactions(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $type = $request->get('type'); 
            $category = $request->get('category');
            $month = $request->get('month');
            $year = $request->get('year', date('Y'));

            $query = WelfareFundTransaction::with(['application', 'processor', 'admin'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($type) {
                $query->where('type', $type);
            }

            if ($category) {
                $query->where('category', $category);
            }

            if ($month) {
                $query->byMonth($month, $year);
            } else {
                $query->byYear($year);
            }

            $transactions = $query->paginate($perPage);

            return $this->successResponse($transactions, 'Transactions retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve transactions', null, 500);
        }
    }

    /**
     * Get all welfare fund transactions with enhanced search and filtering
     */
    public function getAllTransactions(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 50);
            $search = $request->get('search');
            $type = $request->get('type');
            $category = $request->get('category');
            $status = $request->get('status');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            $query = WelfareFundTransaction::with(['application', 'processor', 'admin'])
                ->select('welfare_fund_transactions.*');

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'LIKE', "%{$search}%")
                      ->orWhere('receipt_number', 'LIKE', "%{$search}%")
                      ->orWhere('transactionId', 'LIKE', "%{$search}%")
                      ->orWhere('category', 'LIKE', "%{$search}%");
                });
            }

            // Apply type filter
            if ($type && $type !== 'all') {
                $query->where('type', $type);
            }

            // Apply category filter
            if ($category && $category !== 'all') {
                $query->where('category', $category);
            }

            // Apply status filter (if you have a status field)
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            // Apply date range filter
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            // Apply sorting
            $allowedSortFields = ['created_at', 'amount', 'type', 'category', 'transactionId'];
            $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'created_at';
            $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? strtolower($sortOrder) : 'desc';
            
            $query->orderBy($sortBy, $sortOrder);

            $transactions = $query->paginate($perPage);

            // Transform the data to include additional information
            $transactions->getCollection()->transform(function ($transaction) {
                return [
                    'id' => $transaction->transactionId,
                    'transactionId' => $transaction->transactionId,
                    'type' => $transaction->type,
                    'amount' => (float) $transaction->amount,
                    'category' => $transaction->category,
                    'description' => $transaction->description,
                    'receipt_number' => $transaction->receipt_number,
                    'application_id' => $transaction->application_id,
                    'balance_after' => (float) $transaction->balance_after,
                    'remarks' => $transaction->remarks,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at,
                    'updated_at' => $transaction->updated_at,
                    'created_by' => $transaction->processor ? $transaction->processor->name : 'System',
                    'admin_name' => $transaction->admin ? $transaction->admin->name : null,
                    'status' => 'completed', // Default status since we don't have a status field yet
                    'application' => $transaction->application ? [
                        'id' => $transaction->application->applicationId,
                        'student_name' => $transaction->application->user ? $transaction->application->user->name : 'Unknown',
                        'amount_requested' => $transaction->application->amountRequested,
                        'approved_amount' => $transaction->application->approvedAmount,
                    ] : null
                ];
            });

            return $this->successResponse($transactions, 'All transactions retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve all transactions: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to retrieve transactions: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Create a new welfare fund transaction
     */
    public function createTransaction(Request $request): JsonResponse
    {
        try {
            \Log::info('Create transaction request received', [
                'has_jwt_auth' => auth()->check(),
                'auth_user_id' => auth()->id(),
                'request_data' => $request->all(),
                'headers' => $request->headers->all()
            ]);
            
            // Try to authenticate admin via email if JWT auth failed
            $admin = $this->authenticateAdminByEmail($request);
            
            if (!$admin && !auth()->check()) {
                \Log::error('No authentication method available');
                return $this->errorResponse('Unauthorized. Admin access required.', null, 401);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:inflow,outflow',
                'amount' => 'required|numeric|min:0.01',
                'category' => 'required|string|max:255',
                'description' => 'required|string|max:500',
                'receipt_number' => 'nullable|string|max:255',
                'remarks' => 'nullable|string|max:1000',
                'application_id' => 'nullable|string|exists:applications,applicationId',
                'metadata' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $data = $validator->validated();
            // Use admin ID from either JWT auth or email auth
            $data['processed_by'] = auth()->id() ?? $admin->id ?? $request->get('authenticated_admin')->id;

            $transaction = WelfareFundTransaction::createTransaction($data);
            $transaction->load(['application', 'processor']);

            // Update the current balance after creating the transaction
            $this->updateCurrentBalance();

            return $this->successResponse($transaction, 'Transaction created successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create transaction: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Update welfare fund transaction
     */
    public function updateTransaction(Request $request, string $transactionId): JsonResponse
    {
        try {
            $transaction = WelfareFundTransaction::findOrFail($transactionId);

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|in:inflow,outflow',
                'amount' => 'sometimes|numeric|min:0.01',
                'category' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:500',
                'receipt_number' => 'nullable|string|max:255',
                'remarks' => 'nullable|string|max:1000',
                'metadata' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $transaction->update($validator->validated());
            $transaction->load(['application', 'processor']);

            return $this->successResponse($transaction, 'Transaction updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update transaction: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Delete welfare fund transaction
     */
    public function deleteTransaction(string $transactionId): JsonResponse
    {
        try {
            $transaction = WelfareFundTransaction::findOrFail($transactionId);
            $transaction->delete();

            return $this->successResponse(null, 'Transaction deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete transaction: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Get welfare fund summary with statistics
     */
    public function getSummary(Request $request): JsonResponse
    {
        try {
            $year = $request->get('year', date('Y'));
            $month = $request->get('month');

            $query = WelfareFundTransaction::query();
            if ($month) {
                $query->byMonth($month, $year);
            } else {
                $query->byYear($year);
            }

            // Get basic statistics
            $totalInflow = (clone $query)->inflow()->sum('amount');
            $totalOutflow = (clone $query)->outflow()->sum('amount');
            $netFlow = $totalInflow - $totalOutflow;
            $currentBalance = WelfareFundTransaction::getCurrentBalance();

            // Get statistics by month
            $monthlyStats = WelfareFundTransaction::byYear($year)
                ->selectRaw('
                    MONTH(created_at) as month,
                    SUM(CASE WHEN type = "inflow" THEN amount ELSE 0 END) as total_inflow,
                    SUM(CASE WHEN type = "outflow" THEN amount ELSE 0 END) as total_outflow,
                    COUNT(*) as transaction_count
                ')
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Get statistics by category
            $categoryStats = $query->selectRaw('
                    category,
                    type,
                    SUM(amount) as total_amount,
                    COUNT(*) as transaction_count
                ')
                ->groupBy('category', 'type')
                ->orderBy('total_amount', 'desc')
                ->get();

            return $this->successResponse([
                'current_balance' => $currentBalance,
                'total_inflow' => $totalInflow,
                'total_outflow' => $totalOutflow,
                'net_flow' => $netFlow,
                'monthly_stats' => $monthlyStats,
                'category_stats' => $categoryStats
            ], 'Welfare fund summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve summary: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Get student application statistics by month and program
     */
    public function getStudentApplicationStats(Request $request): JsonResponse
    {
        try {
            $year = $request->get('year', date('Y'));
            $month = $request->get('month');

            // Initialize empty arrays for when no data exists
            $monthlyRequested = collect();
            $monthlyApproved = collect();
            $programStats = collect();

            // Check if applications table has data
            $hasApplications = Application::count() > 0;

            if ($hasApplications) {
                // Get total amount requested by month
                $monthlyRequested = Application::whereYear('submittedAt', $year)
                    ->whereNotNull('submittedAt')
                    ->selectRaw('
                        MONTH(submittedAt) as month,
                        SUM(amountRequested) as total_requested,
                        COUNT(*) as application_count
                    ')
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get();

                // Get total amount approved by month
                $monthlyApproved = Application::whereYear('submittedAt', $year)
                    ->whereNotNull('approvedAmount')
                    ->whereNotNull('submittedAt')
                    ->selectRaw('
                        MONTH(submittedAt) as month,
                        SUM(approvedAmount) as total_approved,
                        COUNT(*) as approved_count
                    ')
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get();

                // Get statistics by student program (only if users table has course field)
                try {
                    $programStats = Application::join('users', 'applications.userId', '=', 'users.id')
                        ->whereYear('applications.submittedAt', $year)
                        ->whereNotNull('applications.submittedAt')
                        ->selectRaw('
                            COALESCE(users.course, "Unknown") as program,
                            SUM(applications.amountRequested) as total_requested,
                            SUM(CASE WHEN applications.approvedAmount IS NOT NULL THEN applications.approvedAmount ELSE 0 END) as total_approved,
                            COUNT(*) as application_count,
                            COUNT(CASE WHEN applications.approvedAmount IS NOT NULL THEN 1 END) as approved_count
                        ')
                        ->groupBy('users.course')
                        ->orderBy('total_requested', 'desc')
                        ->get();
                } catch (\Exception $e) {
                    // If join fails, return empty collection
                    $programStats = collect();
                }
            }

            return $this->successResponse([
                'monthly_requested' => $monthlyRequested,
                'monthly_approved' => $monthlyApproved,
                'program_stats' => $programStats,
                'has_data' => $hasApplications
            ], 'Student application statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve student application statistics: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Automatically create outflow transaction when application is approved
     */
    public function createApprovalTransaction(string $applicationId, float $approvedAmount, string $adminId): bool
    {
        try {
            $application = Application::findOrFail($applicationId);
            
            WelfareFundTransaction::createTransaction([
                'type' => 'outflow',
                'amount' => $approvedAmount,
                'category' => 'student_aid',
                'description' => "Approved application for student aid - {$application->user->name}",
                'application_id' => $applicationId,
                'processed_by' => $adminId,
                'remarks' => "Auto-generated transaction for approved application {$applicationId}"
            ]);

            // Update the current balance after creating the approval transaction
            $this->updateCurrentBalance();

            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to create approval transaction for application {$applicationId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Export transactions to Excel
     */
    public function exportTransactions(Request $request)
    {
        try {
            // Try to authenticate admin via email if JWT auth failed
            $admin = $this->authenticateAdminByEmail($request);
            
            if (!$admin && !auth()->check()) {
                \Log::error('No authentication method available for export');
                return $this->errorResponse('Unauthorized. Admin access required.', null, 401);
            }

            // Build query with filters
            $query = WelfareFundTransaction::with(['processor', 'application']);

            // Apply filters
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [
                    $request->get('start_date') . ' 00:00:00',
                    $request->get('end_date') . ' 23:59:59'
                ]);
            } elseif ($request->has('month') && $request->has('year')) {
                $query->byMonth($request->get('month'), $request->get('year'));
            } elseif ($request->has('year')) {
                $query->byYear($request->get('year'));
            }

            if ($request->has('type')) {
                $query->where('type', $request->get('type'));
            }

            if ($request->has('category')) {
                $query->where('category', $request->get('category'));
            }

            // Order by created_at descending
            $query->orderBy('created_at', 'desc');

            // Get transactions
            $transactions = $query->get();

            // Prepare filters for export title
            $filters = $request->only(['start_date', 'end_date', 'month', 'year', 'type', 'category']);

            // Create export instance
            $export = new TransactionExport($transactions, $filters);
            
            // Generate CSV content
            $csvContent = $export->toCsv();
            $filename = $export->getFilename();

            // Return CSV file
            return response($csvContent)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');

        } catch (\Exception $e) {
            \Log::error('Failed to export transactions: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to export transactions: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Export transactions to PDF
     */
    public function exportTransactionsPdf(Request $request)
    {
        try {
            // Try to authenticate admin via email if JWT auth failed
            $admin = $this->authenticateAdminByEmail($request);
            
            if (!$admin && !auth()->check()) {
                \Log::error('No authentication method available for PDF export');
                return $this->errorResponse('Unauthorized. Admin access required.', null, 401);
            }

            // Build query with filters
            $query = WelfareFundTransaction::with(['processor', 'application']);

            // Apply filters
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [
                    $request->get('start_date') . ' 00:00:00',
                    $request->get('end_date') . ' 23:59:59'
                ]);
            } elseif ($request->has('month') && $request->has('year')) {
                $query->byMonth($request->get('month'), $request->get('year'));
            } elseif ($request->has('year')) {
                $query->byYear($request->get('year'));
            }

            if ($request->has('type')) {
                $query->where('type', $request->get('type'));
            }

            if ($request->has('category')) {
                $query->where('category', $request->get('category'));
            }

            // Order by created_at descending
            $query->orderBy('created_at', 'desc');

            // Get transactions
            $transactions = $query->get();

            // Prepare filters for export title
            $filters = $request->only(['start_date', 'end_date', 'month', 'year', 'type', 'category']);

            // Create PDF export instance
            $pdfExport = new TransactionPdfExport($transactions, $filters);
            
            // Generate PDF
            $pdf = Pdf::loadHTML($pdfExport->toHtml());
            $pdf->setPaper('A4', 'landscape');
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'defaultFont' => 'Arial'
            ]);

            $filename = $pdfExport->getFilename();

            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Log::error('Failed to export transactions to PDF: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to export transactions to PDF: ' . $e->getMessage(), null, 500);
        }
    }
}
