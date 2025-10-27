<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\FundingCategory;
use App\Models\ApplicationDocument;
use App\Http\Requests\FinancialAidApplicationRequest;
use App\Exports\ApplicationExport;
use App\Exports\ApplicationPdfExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\UnauthorizedException;

class ApplicationController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['fundingCategory', 'documents', 'receipts', 'statusLogs'])
            ->orderBy('submittedAt', 'desc');

        // Filter by user email if provided
        $email = $request->query('email');
        if ($email) {
            $user = \App\Models\User::where('email', $email)->first();
            if ($user) {
                $query->where('userId', $user->id);
            } else {
                return $this->successResponse([], 'Applications retrieved successfully');
            }
        }

        $applications = $query->get();
        
        // Log documents for each application
        foreach ($applications as $app) {
            \Log::info('Application documents', [
                'applicationId' => $app->applicationId,
                'documentsCount' => $app->documents->count(),
                'documents' => $app->documents->map(function($doc) {
                    return [
                        'id' => $doc->documentId,
                        'fileName' => $doc->fileName,
                        'documentType' => $doc->documentType
                    ];
                })->toArray()
            ]);
        }

        return $this->successResponse($applications, 'Applications retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fundingCategoryId' => 'required|string|exists:funding_categories,categoryId',
            'amount' => 'required|numeric|min:0',
            'purpose' => 'required|string',
            'additionalNotes' => 'nullable|string'
        ]);

        // Check funding category exists and is active
        $category = FundingCategory::where('categoryId', $validated['fundingCategoryId'])
            ->where('status', 'ACTIVE')
            ->first();

        if (!$category) {
            throw new ResourceNotFoundException('Funding category not found or inactive');
        }

        // Verify amount is within category limit
        if ($validated['amount'] > $category->maxAmount) {
            return $this->errorResponse('Requested amount exceeds category maximum limit', [], 422);
        }

        $application = Application::create([
            'userId' => Auth::id() ?? null,
            'fundingCategoryId' => $validated['fundingCategoryId'],
            'amount' => $validated['amount'],
            'purpose' => $validated['purpose'],
            'additionalNotes' => $validated['additionalNotes'] ?? null,
            'status' => 'PENDING'
        ]);

        // Create initial status log
        $application->statusLogs()->create([
            'status' => 'PENDING',
            'comments' => 'Application submitted'
        ]);

        return $this->successResponse(
            $application->load(['fundingCategory', 'statusLogs']), 
            'Application submitted successfully', 
            201
        );
    }

    /**
     * Store a new financial aid application with comprehensive form data
     */
    public function storeFinancialAid(FinancialAidApplicationRequest $request): JsonResponse
    {
        try {
            // Try to get user from authentication first
            $user = Auth::user();
            
            // Log for debugging
            \Log::info('storeFinancialAid - Auth::user() result:', ['user' => $user ? 'found' : 'null']);
            
            // If no authenticated user, try to find by email from request
            if (!$user && $request->filled('email')) {
                $email = $request->input('email');
                \Log::info('storeFinancialAid - Looking for user by email:', ['email' => $email]);
                
                // Case-insensitive email lookup
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
                
                if ($user) {
                    \Log::info('storeFinancialAid - User found by email:', ['userId' => $user->id, 'email' => $user->email]);
                }
            }
            
            // If still no user, use test user for development
            if (!$user) {
                \Log::info('storeFinancialAid - No user found, attempting fallback to test@example.com');
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', ['test@example.com'])->first();
                if (!$user) {
                    \Log::error('storeFinancialAid - User not found', [
                        'requestEmail' => $request->input('email'),
                        'availableUsers' => \App\Models\User::pluck('email')->toArray()
                    ]);
                    return $this->errorResponse('User not found for submission. Please ensure you are logged in or contact support.', [], 422);
                }
            }
            $validated = $request->validated();
            
            // Generate unique application ID
            $applicationId = 'APP-' . strtoupper(Str::random(8));
            
            // Calculate total amount based on category
            $totalAmount = $this->calculateTotalAmount($validated);
            
            // Create application record with all form data
            $applicationData = array_merge([
                'applicationId' => $applicationId,
                'userId' => $user->id,
                'categoryId' => $validated['categoryId'],
                'formId' => 'FINANCIAL_AID_FORM',
                'formData' => $validated,
                'amountRequested' => $totalAmount,
                'purpose' => $this->generatePurpose($validated),
                'justification' => $this->generateJustification($validated),
                'applicationStatus' => 'SUBMITTED',
                'submittedAt' => now(),
                'updatedAt' => now(),
            ], $validated);
            
            \Log::info('Creating application with data:', $applicationData);
            
            $application = Application::create($applicationData);
            
            if (!$application) {
                throw new \Exception('Failed to create application record');
            }
            
            \Log::info('Application created:', [
                'applicationId' => $application->applicationId,
                'userId' => $application->userId,
                'categoryId' => $application->categoryId,
                'amountRequested' => $application->amountRequested
            ]);

            // Handle file uploads
            try {
                $this->handleFileUploads($request, $application);
            } catch (\Exception $e) {
                \Log::error('File upload failed:', ['error' => $e->getMessage()]);
                // Continue without failing the entire application
            }

            // Create initial status log
            try {
                $application->statusLogs()->create([
                    'logId' => 'LOG-' . strtoupper(Str::random(8)),
                    'previousStatus' => 'NEW',
                    'newStatus' => 'SUBMITTED',
                    'changedBy' => $user->id,
                    'changedAt' => now(),
                    'remarks' => 'Application submitted successfully'
                ]);
            } catch (\Exception $e) {
                \Log::error('Status log creation failed:', ['error' => $e->getMessage()]);
                // Continue without failing the entire application
            }

            // Load relationships and return response
            try {
                $applicationWithRelations = $application->load(['user', 'documents']);
                \Log::info('Application created successfully:', ['applicationId' => $application->applicationId]);
                
                return $this->successResponse(
                    $applicationWithRelations,
                    'Financial aid application submitted successfully',
                    201
                );
            } catch (\Exception $e) {
                \Log::error('Failed to load relationships:', ['error' => $e->getMessage()]);
                
                // Return response without relationships if loading fails
                return $this->successResponse(
                    $application,
                    'Financial aid application submitted successfully',
                    201
                );
            }

        } catch (\Exception $e) {
            return $this->errorResponse(
                'Failed to submit application: ' . $e->getMessage(),
                [],
                500
            );
        }
    }

    /**
     * Calculate total amount based on fund category
     */
    private function calculateTotalAmount(array $validated): float
    {
        $categoryId = $validated['categoryId'];
        
        return match($categoryId) {
            'CAT-BEREAVEMENT' => match($validated['bereavementType'] ?? '') {
                'student' => 500.00,
                'parent' => 200.00,
                'sibling' => 100.00,
                default => 0.00
            },
            'CAT-ILLNESS-OUTPATIENT' => (float) ($validated['totalAmountOutpatient'] ?? 0),
            'CAT-ILLNESS-INPATIENT' => (float) ($validated['totalAmountInpatient'] ?? 0),
            'CAT-ILLNESS-CHRONIC' => (float) ($validated['totalAmountInjuries'] ?? 0),
            'CAT-EMERGENCY-NATURAL' => (float) ($validated['totalAmountCriticalIllness'] ?? 0),
            'CAT-EMERGENCY-FAMILY' => (float) ($validated['totalAmountNaturalDisaster'] ?? 0),
            'CAT-EMERGENCY-OTHERS' => (float) ($validated['totalAmountOthers'] ?? 0),
            default => 0.00
        };
    }


    /**
     * Generate purpose description
     */
    private function generatePurpose(array $validated): string
    {
        $categoryId = $validated['categoryId'];
        
        return match($categoryId) {
            'CAT-BEREAVEMENT' => 'Bereavement (Khairat) - ' . ucfirst($validated['bereavementType'] ?? 'Unknown'),
            'CAT-ILLNESS-OUTPATIENT' => 'Illness & Injuries - Outpatient Treatment',
            'CAT-ILLNESS-INPATIENT' => 'Illness & Injuries - Inpatient Treatment',
            'CAT-ILLNESS-CHRONIC' => 'Illness & Injuries - Chronic Treatment',
            'CAT-EMERGENCY-NATURAL' => 'Emergency - Natural Disaster',
            'CAT-EMERGENCY-FAMILY' => 'Emergency - Family Emergency',
            'CAT-EMERGENCY-OTHERS' => 'Emergency - Other Emergency',
            default => 'Financial Aid Application'
        };
    }

    /**
     * Generate justification
     */
    private function generateJustification(array $validated): string
    {
        $categoryId = $validated['categoryId'];
        
        return match($categoryId) {
            'CAT-BEREAVEMENT' => 'Financial assistance for bereavement expenses',
            'CAT-ILLNESS-OUTPATIENT' => 'Outpatient treatment: ' . ($validated['reasonVisit'] ?? ''),
            'CAT-ILLNESS-INPATIENT' => 'Inpatient treatment: ' . ($validated['reasonVisitInpatient'] ?? ''),
            'CAT-ILLNESS-CHRONIC' => 'Injury support equipment',
            'CAT-EMERGENCY-NATURAL' => 'Critical illness support',
            'CAT-EMERGENCY-FAMILY' => 'Natural disaster assistance: ' . ($validated['naturalDisasterCase'] ?? ''),
            'CAT-EMERGENCY-OTHERS' => 'Emergency assistance: ' . ($validated['othersCase'] ?? ''),
            default => 'Financial aid application'
        };
    }

    /**
     * Handle file uploads for the application
     */
    private function handleFileUploads(FinancialAidApplicationRequest $request, Application $application): void
    {
        $categoryId = $application->categoryId;
        
        // Handle bereavement documents
        if ($categoryId === 'CAT-BEREAVEMENT' && $request->hasFile('deathCertificate')) {
            $this->uploadMultipleDocuments($request->file('deathCertificate'), $application, 'death_certificate');
        }
        
        // Handle illness-injuries documents
        if ($categoryId === 'CAT-ILLNESS-OUTPATIENT' && $request->hasFile('receiptClinic')) {
            $this->uploadMultipleDocuments($request->file('receiptClinic'), $application, 'clinic_receipt');
        }
        
        if ($categoryId === 'CAT-ILLNESS-INPATIENT' && $request->hasFile('hospitalDocuments')) {
            $this->uploadMultipleDocuments($request->file('hospitalDocuments'), $application, 'hospital_documents');
        }
        
        if ($categoryId === 'CAT-ILLNESS-CHRONIC' && $request->hasFile('injuryDocuments')) {
            $this->uploadMultipleDocuments($request->file('injuryDocuments'), $application, 'injury_documents');
        }
        
        // Handle emergency documents
        if ($categoryId === 'CAT-EMERGENCY-FAMILY' && $request->hasFile('criticalIllnessDocuments')) {
            $this->uploadMultipleDocuments($request->file('criticalIllnessDocuments'), $application, 'critical_illness_documents');
        }
        
        if ($categoryId === 'CAT-EMERGENCY-NATURAL' && $request->hasFile('naturalDisasterDocuments')) {
            $this->uploadMultipleDocuments($request->file('naturalDisasterDocuments'), $application, 'natural_disaster_documents');
        }
        
        if ($categoryId === 'CAT-EMERGENCY-OTHERS' && $request->hasFile('othersDocuments')) {
            $this->uploadMultipleDocuments($request->file('othersDocuments'), $application, 'others_documents');
        }
    }

    /**
     * Upload a document and create database record
     */
    private function uploadDocument($file, Application $application, string $documentType): void
    {
        $fileName = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('application_documents', $fileName, 'public');
        
        ApplicationDocument::create([
            'documentId' => 'DOC-' . strtoupper(Str::random(8)),
            'applicationId' => $application->applicationId,
            'uploadedBy' => $application->userId,
            'fileName' => $fileName,
            'filePath' => $path,
            'fileType' => $file->getMimeType(),
            'fileSize' => $file->getSize(),
            'documentType' => $documentType,
            'uploadedAt' => now(),
            'description' => ucfirst(str_replace('_', ' ', $documentType)),
            'status' => 'active'
        ]);
    }

    /**
     * Upload multiple documents and create database records
     */
    private function uploadMultipleDocuments($files, Application $application, string $documentType): void
    {
        \Log::info('uploadMultipleDocuments called', [
            'documentType' => $documentType,
            'isArray' => is_array($files),
            'filesCount' => is_array($files) ? count($files) : ($files ? 1 : 0)
        ]);

        // Handle both single file and array of files
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($file && $file->isValid()) {
                    \Log::info('Uploading file', [
                        'fileName' => $file->getClientOriginalName(),
                        'fileSize' => $file->getSize()
                    ]);
                    $this->uploadDocument($file, $application, $documentType);
                }
            }
        } else {
            // Single file (backward compatibility)
            if ($files && $files->isValid()) {
                \Log::info('Uploading single file', [
                    'fileName' => $files->getClientOriginalName(),
                    'fileSize' => $files->getSize()
                ]);
                $this->uploadDocument($files, $application, $documentType);
            }
        }
    }

    public function show(string $id): JsonResponse
    {
        $application = Application::with(['fundingCategory', 'documents', 'statusLogs', 'receipts'])
            ->where('applicationId', $id)
            ->first();

        if (!$application) {
            throw new ResourceNotFoundException('Application not found');
        }

        // Check if user owns this application
        if ($application->userId !== Auth::id() && !Auth::guard('admin')->check()) {
            throw new UnauthorizedException('You are not authorized to view this application');
        }

        return $this->successResponse($application, 'Application retrieved successfully');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $application = Application::where('applicationId', $id)->firstOrFail();

        // Only allow updates for pending applications
        if ($application->applicationStatus !== 'SUBMITTED') {
            return $this->errorResponse('Can only update submitted applications', null, 422);
        }

        // Only allow owner to update
        if ($application->userId !== Auth::id()) {
            throw new UnauthorizedException('You are not authorized to update this application');
        }

        $validated = $request->validate([
            'amount' => 'numeric|min:0',
            'purpose' => 'string',
            'additionalNotes' => 'nullable|string'
        ]);

        // If amount is being updated, verify it's within category limit
        if (isset($validated['amount'])) {
            $category = FundingCategory::findOrFail($application->fundingCategoryId);
            if ($validated['amount'] > $category->maxAmount) {
                return $this->errorResponse('Requested amount exceeds category maximum limit', null, 422);
            }
        }

        $application->update($validated);

        return $this->successResponse(
            $application->load(['fundingCategory', 'documents', 'statusLogs']),
            'Application updated successfully'
        );
    }

    /**
     * Export applications to CSV
     */
    public function exportApplications(Request $request)
    {
        try {
            // Try to authenticate admin via email if JWT auth failed
            $admin = $this->authenticateAdminByEmail($request);
            
            if (!$admin && !auth()->check()) {
                \Log::error('No authentication method available for application export');
                return $this->errorResponse('Unauthorized. Admin access required.', null, 401);
            }

            // Build query with relationships
            $query = Application::with(['user', 'admin', 'committee', 'category']);

            // Apply filters
            if ($request->has('export_period')) {
                $period = $request->get('export_period');
                $now = now();
                
                switch ($period) {
                    case '1_month':
                        $query->where('submittedAt', '>=', $now->subMonth());
                        break;
                    case '3_months':
                        $query->where('submittedAt', '>=', $now->subMonths(3));
                        break;
                    case '1_year':
                        $query->where('submittedAt', '>=', $now->subYear());
                        break;
                }
            } elseif ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('submittedAt', [
                    $request->get('start_date') . ' 00:00:00',
                    $request->get('end_date') . ' 23:59:59'
                ]);
            } elseif ($request->has('month') && $request->has('year')) {
                $query->whereMonth('submittedAt', $request->get('month'))
                      ->whereYear('submittedAt', $request->get('year'));
            } elseif ($request->has('year')) {
                $query->whereYear('submittedAt', $request->get('year'));
            }

            if ($request->has('status')) {
                $query->where('applicationStatus', $request->get('status'));
            }

            if ($request->has('category')) {
                $query->where('fundCategory', $request->get('category'));
            }

            // Order by submitted date descending
            $query->orderBy('submittedAt', 'desc');

            // Get applications
            $applications = $query->get();

            // Prepare filters for export title
            $filters = $request->only(['export_period', 'start_date', 'end_date', 'month', 'year', 'status', 'category']);

            // Create CSV export instance
            $csvExport = new ApplicationExport($applications, $filters);
            
            // Generate CSV content
            $csvContent = $csvExport->toCsv();
            $filename = $csvExport->getFilename();

            // Return CSV response
            return response($csvContent)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');

        } catch (\Exception $e) {
            \Log::error('Failed to export applications to CSV: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to export applications to CSV: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Authenticate admin by email (fallback method)
     */
    private function authenticateAdminByEmail(Request $request)
    {
        $email = $request->get('email') ?? $request->header('X-Admin-Email');
        
        \Log::info('Attempting email-based admin authentication for application export', [
            'email' => $email,
            'email_from_param' => $request->get('email'),
            'email_from_header' => $request->header('X-Admin-Email')
        ]);
        
        if (!$email) {
            \Log::warning('No admin email found in request');
            return null;
        }
        
        // Check if this is an admin email from config
        $admins = config('admin.admins');
        
        // If no admin config is available, allow common admin emails for development
        if (!$admins || empty($admins)) {
            \Log::info('No admin config found, using fallback admin emails');
            $fallbackAdmins = [
                'admin1@unikl.com',
                'admin2@unikl.com',
                'admin@unikl.com',
                'admin@example.com'
            ];
            
            if (in_array($email, $fallbackAdmins)) {
                \Log::info('Admin authenticated via fallback email', ['email' => $email]);
                return ['email' => $email, 'name' => 'Admin User'];
            }
        } else {
            $admin = collect($admins)->firstWhere('email', $email);
            
            if ($admin) {
                \Log::info('Admin found via email', ['admin_id' => $admin['email'], 'email' => $email]);
                return $admin;
            }
        }
        
        \Log::warning('Admin not found for email', ['email' => $email]);
        return null;
    }

    /**
     * Export applications to PDF
     */
    public function exportApplicationsPdf(Request $request)
    {
        try {
            // Try to authenticate admin via email if JWT auth failed
            $admin = $this->authenticateAdminByEmail($request);
            
            if (!$admin && !auth()->check()) {
                \Log::error('No authentication method available for application PDF export');
                return $this->errorResponse('Unauthorized. Admin access required.', null, 401);
            }

            // Build query with relationships
            $query = Application::with(['user', 'admin', 'committee', 'category']);

            // Apply filters
            if ($request->has('export_period')) {
                $period = $request->get('export_period');
                $now = now();
                
                switch ($period) {
                    case '1_month':
                        $query->where('submittedAt', '>=', $now->subMonth());
                        break;
                    case '3_months':
                        $query->where('submittedAt', '>=', $now->subMonths(3));
                        break;
                    case '1_year':
                        $query->where('submittedAt', '>=', $now->subYear());
                        break;
                }
            } elseif ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('submittedAt', [
                    $request->get('start_date') . ' 00:00:00',
                    $request->get('end_date') . ' 23:59:59'
                ]);
            } elseif ($request->has('month') && $request->has('year')) {
                $query->whereMonth('submittedAt', $request->get('month'))
                      ->whereYear('submittedAt', $request->get('year'));
            } elseif ($request->has('year')) {
                $query->whereYear('submittedAt', $request->get('year'));
            }

            if ($request->has('status')) {
                $query->where('applicationStatus', $request->get('status'));
            }

            if ($request->has('category')) {
                $query->where('fundCategory', $request->get('category'));
            }

            // Order by submitted date descending
            $query->orderBy('submittedAt', 'desc');

            // Get applications
            $applications = $query->get();

            // Prepare filters for export title
            $filters = $request->only(['export_period', 'start_date', 'end_date', 'month', 'year', 'status', 'category']);

            // Create PDF export instance
            $pdfExport = new ApplicationPdfExport($applications, $filters);
            
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
            \Log::error('Failed to export applications to PDF: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to export applications to PDF: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Update application documents (for students)
     */
    public function updateDocuments(Request $request, string $id): JsonResponse
    {
        try {
            // Debug: Try to access files directly from PHP $_FILES
            $files = $_FILES ?? [];
            
            // Log all $_FILES keys to see what's there
            if (!empty($files)) {
                foreach ($files as $key => $value) {
                    \Log::info("Found in _FILES: {$key}", ['value' => $value]);
                }
            } else {
                \Log::info('$_FILES is empty');
            }
            
            // Also try parsing the raw input if $_FILES is empty
            $rawContentLength = $request->header('Content-Length') ?? 0;
            \Log::info('Request details', [
                'applicationId' => $id,
                'method' => $request->method(),
                'contentType' => $request->header('Content-Type'),
                'contentLength' => $rawContentLength,
                '_FILES_count' => count($files),
                '_FILES_keys' => array_keys($files),
                'hasFile_deathCertificate' => $request->hasFile('deathCertificate'),
                'hasFile_deathCertificate0' => $request->hasFile('deathCertificate[0]'),
                'allFiles_keys' => array_keys($request->allFiles()),
                'allKeys' => array_keys($request->all()),
                'request_all' => $request->all(),
            ]);
            
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Find the application
            $application = Application::where('applicationId', $id)
                ->where('userId', $user->id)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or access denied'
                ], 404);
            }

            // Check if application is in a state that allows document updates
            // Use applicationStatus field from database
            $allowedStatuses = ['submitted', 'under_review', 'pending_documents', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS'];
            $currentStatus = $application->applicationStatus ?? $application->status ?? 'unknown';
            
            if (!in_array($currentStatus, $allowedStatuses)) {
                \Log::info('Application status not allowed for update', [
                    'applicationId' => $application->applicationId,
                    'applicationStatus' => $application->applicationStatus,
                    'status' => $application->status,
                    'currentStatus' => $currentStatus
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be updated in current status: ' . $currentStatus
                ], 400);
            }

            // Note: We skip validation here to avoid issues with empty form submissions
            // Files will be validated by handleDocumentUpdates if any are provided

            // Handle file uploads
            $this->handleDocumentUpdates($request, $application);

            // Update application status if it was pending documents
            if ($application->status === 'pending_documents') {
                $application->update(['status' => 'submitted']);
                
                // Log status change
                ApplicationStatusLog::create([
                    'applicationId' => $application->applicationId,
                    'status' => 'submitted',
                    'changedBy' => $user->id,
                    'changedAt' => now(),
                    'comments' => 'Documents uploaded, application resubmitted'
                ]);
            }

            // Refresh application with latest documents
            $application->refresh();
            $application->load('documents');
            
            \Log::info('Returning updated application', [
                'applicationId' => $application->applicationId,
                'documentsCount' => $application->documents->count(),
                'documents' => $application->documents->map(function($doc) {
                    return [
                        'id' => $doc->documentId,
                        'fileName' => $doc->fileName,
                        'documentType' => $doc->documentType
                    ];
                })->toArray()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Documents updated successfully',
                'data' => $application
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating application documents', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update documents: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle document updates for existing applications
     */
    private function handleDocumentUpdates(Request $request, Application $application): void
    {
        $categoryId = $application->categoryId;
        
        \Log::info('handleDocumentUpdates called', [
            'categoryId' => $categoryId,
            'allFilesKeys' => array_keys($request->allFiles())
        ]);
        
        // Collect all files for the appropriate category
        $filesToUpload = [];
        $documentType = '';
        
        // Handle bereavement documents
        if ($categoryId === 'CAT-BEREAVEMENT') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'deathCertificate') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'death_certificate';
                }
            }
        }
        
        // Handle illness-injuries documents
        if ($categoryId === 'CAT-ILLNESS-OUTPATIENT') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'receiptClinic') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'clinic_receipt';
                }
            }
        }
        
        if ($categoryId === 'CAT-ILLNESS-INPATIENT') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'hospitalDocuments') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'hospital_documents';
                }
            }
        }
        
        if ($categoryId === 'CAT-ILLNESS-CHRONIC') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'injuryDocuments') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'injury_documents';
                }
            }
        }
        
        // Handle emergency documents
        if ($categoryId === 'CAT-EMERGENCY-FAMILY') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'criticalIllnessDocuments') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'critical_illness_documents';
                }
            }
        }
        
        if ($categoryId === 'CAT-EMERGENCY-NATURAL') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'naturalDisasterDocuments') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'natural_disaster_documents';
                }
            }
        }
        
        if ($categoryId === 'CAT-EMERGENCY-OTHERS') {
            $files = $request->allFiles();
            foreach ($files as $key => $file) {
                if (strpos($key, 'othersDocuments') === 0) {
                    if (is_array($file)) {
                        $filesToUpload = array_merge($filesToUpload, array_filter($file));
                    } else {
                        $filesToUpload[] = $file;
                    }
                    $documentType = 'others_documents';
                }
            }
        }
        
        \Log::info('Files collected', [
            'filesToUploadCount' => count($filesToUpload),
            'documentType' => $documentType
        ]);
        
        // Upload files if any exist
        if (!empty($filesToUpload) && !empty($documentType)) {
            $this->uploadMultipleDocuments($filesToUpload, $application, $documentType);
        }
    }

    /**
     * Get application details for editing (student only)
     */
    public function getApplicationForEdit(string $id): JsonResponse
    {
        try {
            \Log::info('getApplicationForEdit called with ID: ' . $id);
            \Log::info('Request headers: ' . json_encode(request()->headers->all()));
            
            $user = auth()->user();
            if (!$user) {
                \Log::info('No authenticated user found');
                \Log::info('Auth check: ' . (auth()->check() ? 'true' : 'false'));
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            \Log::info('Authenticated user: ' . $user->id);

            // Find the application
            $application = Application::with(['fundingCategory', 'documents'])
                ->where('applicationId', $id)
                ->where('userId', $user->id)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or access denied'
                ], 404);
            }

            // Check if application can be edited
            $currentStatus = $application->applicationStatus ?? $application->status ?? '';
            if (in_array($currentStatus, ['approved', 'rejected', 'APPROVED', 'REJECTED'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be edited in current status'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $application
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching application for edit: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application'
            ], 500);
        }
    }

    /**
     * Delete a document from application (student only)
     */
    public function deleteDocument(string $applicationId, string $documentId): JsonResponse
    {
        try {
            \Log::info('deleteDocument called', [
                'applicationId' => $applicationId,
                'documentId' => $documentId
            ]);
            
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Find the application
            $application = Application::where('applicationId', $applicationId)
                ->where('userId', $user->id)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or access denied'
                ], 404);
            }

            // Check if application can be edited
            $currentStatus = $application->applicationStatus ?? $application->status ?? '';
            if (in_array($currentStatus, ['approved', 'rejected', 'APPROVED', 'REJECTED'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be edited in current status'
                ], 400);
            }

            // Find and delete the document - explicitly use documentId
            \Log::info('Searching for document', [
                'documentId' => $documentId,
                'applicationId' => $application->applicationId
            ]);
            
            $document = ApplicationDocument::where('documentId', $documentId)
                ->where('applicationId', $application->applicationId)
                ->first();

            if (!$document) {
                \Log::error('Document not found', [
                    'documentId' => $documentId,
                    'applicationId' => $application->applicationId
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Delete the file from storage
            if ($document->filePath && \Storage::disk('public')->exists($document->filePath)) {
                \Storage::disk('public')->delete($document->filePath);
            }

            // Delete the database record
            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting document', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document'
            ], 500);
        }
    }
}