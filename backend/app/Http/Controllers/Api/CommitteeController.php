<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationStatusLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CommitteeController extends Controller
{
    use ApiResponse;

    public function getEligibleApplications(Request $request): JsonResponse
    {
        try {
            // Check committee authentication - either JWT or email parameter (same pattern as admin)
            $committee = null;
            
            // If we have an email in the request, use it for fallback authentication
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found with the provided email', 401);
                }
                
                // Log fallback authentication
                Log::info('Committee authenticated with email fallback', [
                    'email' => $request->email,
                    'committee_id' => $committee->id,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            } else {
                // JWT authentication should already be handled by middleware
                // But we'll check it again here to be safe
                if (!Auth::guard('committee')->check() && !Auth::check()) {
                    return $this->errorResponse('Unauthorized access', 401);
                }
                
                // Get the authenticated committee user
                $committee = Auth::guard('committee')->user() ?? Auth::user();
                
                // Log JWT authentication
                Log::info('Committee authenticated with JWT token', [
                    'committee_id' => $committee ? $committee->id : null,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            }
            
            // If still no committee user, return error
            if (!$committee) {
                return $this->errorResponse('Unauthorized access - No authenticated committee member or valid email provided', 401);
            }
            
            // Get applications that this committee member can review
            // Committee can only review specific categories: CAT-ILLNESS-INPATIENT and CAT-EMERGENCY-OTHERS
            $query = Application::query()
                ->with(['documents', 'statusLogs', 'user', 'category'])
                ->whereIn('applicationStatus', ['SUBMITTED', 'admin_suggested'])
                ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                ->orderBy('submittedAt', 'desc');
            
            // Log the raw SQL query for debugging
            Log::info('Committee applications query', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);
            
            $applications = $query->get();
            
            // Log how many applications were found
            Log::info('Committee applications found', ['count' => $applications->count()]);
            
            $formattedApplications = $applications->map(function($app) {
                return [
                    'id' => $app->applicationId,
                    'studentName' => $app->user->name ?? 'Unknown',
                    'studentId' => $app->studentId,
                    'studentEmail' => $app->user->email ?? '',
                    'course' => $app->course,
                    'semester' => $app->semester,
                    'type' => $this->getApplicationTypeLabel($app),
                    'requestedAmount' => $app->amountRequested,
                    'suggestedAmount' => $app->approvedAmount,
                    'status' => $app->applicationStatus,
                    'submittedDate' => $app->submittedAt?->format('Y-m-d'),
                    'lastUpdated' => $app->updatedAt?->format('Y-m-d'),
                    'purpose' => $app->purpose,
                    'justification' => $app->justification,
                    'contactNumber' => $app->contactNumber,
                    'emergencyContact' => $app->emergencyContact,
                    'documents' => $app->documents->map(function ($doc) {
                        return [
                            'documentId' => $doc->documentId,
                            'fileName' => $doc->fileName,
                            'filePath' => $doc->filePath,
                            'documentType' => $doc->documentType,
                            'fileType' => $doc->fileType,
                            'status' => $doc->status
                        ];
                    }),
                    'categoryDetails' => [
                        'fundCategory' => $app->categoryId,
                        'fundSubCategory' => $this->getSubCategoryFromCategory($app->categoryId),
                        'totalAmount' => $this->getTotalAmount($app),
                        'specificDetails' => $this->getSpecificDetails($app)
                    ]
                ];
            });

            return $this->successResponse([
                'applications' => $formattedApplications
            ], 'Applications retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching committee applications: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $this->errorResponse('Failed to fetch applications: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get specific application details for committee review
     */
    public function getApplication(Request $request, $id): JsonResponse
    {
        try {
            // Check committee authentication (same pattern as getEligibleApplications)
            $committee = null;
            
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found with the provided email', 401);
                }
            } else {
                if (!Auth::guard('committee')->check() && !Auth::check()) {
                    return $this->errorResponse('Unauthorized access', 401);
                }
                $committee = Auth::guard('committee')->user() ?? Auth::user();
            }
            
            if (!$committee) {
                return $this->errorResponse('Unauthorized access - No authenticated committee member or valid email provided', 401);
            }

            $application = Application::with(['user', 'category', 'documents', 'admin'])
                ->where('applicationId', $id)
                ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                ->first();

            if (!$application) {
                return $this->errorResponse('Application not found or not eligible for committee review', 404);
            }

            $responseData = [
                'id' => $application->applicationId,
                'studentName' => $application->user->name ?? 'Unknown',
                'studentId' => $application->studentId,
                'studentEmail' => $application->user->email ?? '',
                'course' => $application->course,
                'semester' => $application->semester,
                'type' => $this->getApplicationTypeLabel($application),
                'requestedAmount' => $application->amountRequested,
                'suggestedAmount' => $application->approvedAmount,
                'status' => $application->applicationStatus,
                'submittedDate' => $application->submittedAt?->format('Y-m-d'),
                'lastUpdated' => $application->updatedAt?->format('Y-m-d'),
                'adminReviewer' => $application->admin->name ?? 'Unknown Admin',
                'adminComments' => $application->adminComments,
                'committeeComments' => $application->committeeComments,
                'purpose' => $application->purpose,
                'justification' => $application->justification,
                'contactNumber' => $application->contactNumber,
                'emergencyContact' => $application->emergencyContact,
                'cgpa' => $application->user->cgpa ?? 'N/A',
                'documents' => $application->documents->map(function ($doc) {
                    return [
                        'documentId' => $doc->documentId,
                        'fileName' => $doc->fileName,
                        'filePath' => $doc->filePath,
                        'documentType' => $doc->documentType,
                        'fileType' => $doc->fileType,
                        'status' => $doc->status
                    ];
                }),
                'categoryDetails' => [
                    'fundCategory' => $application->categoryId,
                    'fundSubCategory' => $this->getSubCategoryFromCategory($application->categoryId),
                    'totalAmount' => $this->getTotalAmount($application),
                    'specificDetails' => $this->getSpecificDetails($application)
                ]
            ];

            return $this->successResponse($responseData, 'Application details retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching application details: ' . $e->getMessage());
            return $this->errorResponse('Failed to fetch application details', 500);
        }
    }

    /**
     * Approve application by committee
     */
    public function approveApplication(Request $request, $id): JsonResponse
    {
        try {
            // First verify committee authentication (same logic as admin)
            $committeeId = null;
            
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found', 404);
                }
                $committeeId = $committee->id;
            } else if (Auth::guard('committee')->check()) {
                $committeeId = Auth::guard('committee')->id();
            } else {
                return $this->errorResponse('Unauthorized', 401);
            }

            $validator = Validator::make($request->all(), [
                'finalAmount' => 'required|numeric|min:0',
                'comments' => 'required|string|min:10|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', 422, $validator->errors());
            }

            $application = Application::where('applicationId', $id)
                ->whereIn('applicationStatus', ['SUBMITTED', 'admin_suggested'])
                ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                ->first();

            if (!$application) {
                return $this->errorResponse('Application not found or not eligible for committee approval', 404);
            }

            // Committee can approve unlimited amounts for special categories
            // No amount validation needed

            // Update application
            $application->update([
                'applicationStatus' => 'committee_approved',
                'approvedAmount' => $request->finalAmount,
                'committeeComments' => $request->comments,
                'committeeId' => $committeeId, // Use the verified committee ID
                'committeeReviewedAt' => now(),
                'updatedAt' => now()
            ]);

            // Log status change
            ApplicationStatusLog::create([
                'logId' => 'LOG-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'applicationId' => $application->applicationId,
                'previousStatus' => $application->applicationStatus,
                'newStatus' => 'committee_approved',
                'changedBy' => $committeeId, // Use the verified committee ID
                'changedAt' => now(),
                'comments' => $request->comments
            ]);

            // Create notification for admin to upload receipt
            \App\Models\Notification::create([
                'notificationId' => 'NOTIF-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'userId' => $application->userId, // Notify the student
                'applicationId' => $application->applicationId,
                'title' => 'Application Committee Approved',
                'message' => "Your application (ID: {$application->applicationId}) has been approved by committee for RM{$request->finalAmount}. Admin will now upload the receipt to finalize the approval.",
                'type' => 'COMMITTEE_APPROVED',
                'status' => 'UNREAD',
                'createdAt' => now()
            ]);

            return $this->successResponse([
                'applicationId' => $application->applicationId,
                'status' => 'committee_approved',
                'approvedAmount' => $application->approvedAmount,
                'comments' => $application->committeeComments
            ], 'Application approved successfully');

        } catch (\Exception $e) {
            Log::error('Error approving application: ' . $e->getMessage());
            return $this->errorResponse('Failed to approve application', 500);
        }
    }

    /**
     * Reject application by committee
     */
    public function rejectApplication(Request $request, $id): JsonResponse
    {
        try {
            // First verify committee authentication (same logic as approveApplication)
            $committeeId = null;
            
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found', 404);
                }
                $committeeId = $committee->id;
            } else if (Auth::guard('committee')->check()) {
                $committeeId = Auth::guard('committee')->id();
            } else {
                return $this->errorResponse('Unauthorized', 401);
            }

            $validator = Validator::make($request->all(), [
                'comments' => 'required|string|min:10|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', 422, $validator->errors());
            }

            $application = Application::where('applicationId', $id)
                ->whereIn('applicationStatus', ['SUBMITTED', 'admin_suggested'])
                ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                ->first();

            if (!$application) {
                return $this->errorResponse('Application not found or not eligible for committee review', 404);
            }

            // Update application
            $application->update([
                'applicationStatus' => 'committee_rejected',
                'committeeComments' => $request->comments,
                'committeeId' => $committeeId, // Use the verified committee ID
                'committeeReviewedAt' => now(),
                'updatedAt' => now()
            ]);

            // Log status change
            ApplicationStatusLog::create([
                'logId' => 'LOG-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'applicationId' => $application->applicationId,
                'previousStatus' => $application->applicationStatus,
                'newStatus' => 'committee_rejected',
                'changedBy' => $committeeId, // Use the verified committee ID
                'changedAt' => now(),
                'comments' => $request->comments
            ]);

            // Create notification for student
            \App\Models\Notification::create([
                'notificationId' => 'NOTIF-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'userId' => $application->userId,
                'applicationId' => $application->applicationId,
                'title' => 'Application Committee Rejected',
                'message' => "Your application (ID: {$application->applicationId}) has been rejected by committee.",
                'type' => 'COMMITTEE_REJECTED',
                'status' => 'UNREAD',
                'createdAt' => now()
            ]);

            return $this->successResponse([
                'applicationId' => $application->applicationId,
                'status' => 'committee_rejected',
                'comments' => $application->committeeComments
            ], 'Application rejected successfully');

        } catch (\Exception $e) {
            Log::error('Error rejecting application: ' . $e->getMessage());
            return $this->errorResponse('Failed to reject application', 500);
        }
    }

    /**
     * Get committee dashboard statistics
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        try {
            // Check committee authentication (same pattern as other methods)
            $committee = null;
            
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found with the provided email', 401);
                }
            } else {
                if (!Auth::guard('committee')->check() && !Auth::check()) {
                    return $this->errorResponse('Unauthorized access', 401);
                }
                $committee = Auth::guard('committee')->user() ?? Auth::user();
            }
            
            if (!$committee) {
                return $this->errorResponse('Unauthorized access - No authenticated committee member or valid email provided', 401);
            }

            $stats = [
                'pendingReview' => Application::whereIn('applicationStatus', ['SUBMITTED', 'admin_suggested'])
                    ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                    ->count(),

                'approved' => Application::where('applicationStatus', 'committee_approved')
                    ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                    ->count(),

                'rejected' => Application::where('applicationStatus', 'committee_rejected')
                    ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                    ->count(),

                'totalAmount' => Application::where('applicationStatus', 'committee_approved')
                    ->whereIn('categoryId', ['CAT-ILLNESS-INPATIENT', 'CAT-EMERGENCY-OTHERS'])
                    ->sum('approvedAmount') ?? 0
            ];

            $stats['total'] = $stats['pendingReview'] + $stats['approved'] + $stats['rejected'];

            return $this->successResponse($stats, 'Dashboard statistics retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard stats: ' . $e->getMessage());
            return $this->errorResponse('Failed to fetch dashboard statistics', 500);
        }
    }

    /**
     * Get committee member's profile
     */
    public function getProfile(Request $request): JsonResponse
    {
        try {
            // Check committee authentication (same pattern as other methods)
            $committee = null;
            
            if ($request->has('email')) {
                $committee = \App\Models\Committee::where('email', $request->email)->first();
                if (!$committee) {
                    return $this->errorResponse('Committee member not found with the provided email', 401);
                }
            } else {
                if (!Auth::guard('committee')->check() && !Auth::check()) {
                    return $this->errorResponse('Unauthorized access', 401);
                }
                $committee = Auth::guard('committee')->user() ?? Auth::user();
            }
            
            if (!$committee) {
                return $this->errorResponse('Unauthorized access - No authenticated committee member or valid email provided', 401);
            }

            // If we have a real committee model, return it; else fallback demo payload
            if ($committee) {
                return $this->successResponse([
                    'id' => (string) $committee->id,
                    'name' => $committee->fullName ?? 'Committee User',
                    'email' => $committee->email,
                    'username' => $committee->username ?? explode('@', $committee->email)[0],
                    'department' => 'Finance Department',
                    'position' => 'Committee Member',
                    'createdAt' => $committee->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
                    'updatedAt' => $committee->updated_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
                ], 'Committee profile retrieved successfully');
            }

            return $this->errorResponse('Committee not found', 404);

        } catch (\Exception $e) {
            Log::error('Error fetching committee profile: ' . $e->getMessage());
            return $this->errorResponse('Failed to fetch profile', 500);
        }
    }

    /**
     * Helper method to get application type label
     */
    private function getApplicationTypeLabel($application): string
    {
        switch ($application->categoryId) {
            case 'CAT-ILLNESS-INPATIENT':
                return 'In-patient Treatment';
            case 'CAT-ILLNESS-OUTPATIENT':
                return 'Out-patient Treatment';
            case 'CAT-ILLNESS-CHRONIC':
                return 'Chronic Illness Treatment';
            case 'CAT-EMERGENCY-NATURAL':
                return 'Natural Disaster Emergency';
            case 'CAT-EMERGENCY-FAMILY':
                return 'Family Emergency';
            case 'CAT-EMERGENCY-OTHERS':
                return 'Other Emergency';
            case 'CAT-BEREAVEMENT':
                return 'Bereavement (Khairat)';
            default:
                return 'Unknown';
        }
    }

    /**
     * Helper method to get total amount based on category
     */
    private function getTotalAmount($application)
    {
        switch ($application->categoryId) {
            case 'CAT-ILLNESS-INPATIENT':
                return $application->totalAmountInpatient;
            case 'CAT-EMERGENCY-OTHERS':
                return $application->totalAmountOthers;
            default:
                return null;
        }
    }

    /**
     * Helper method to get specific details based on category
     */
    private function getSpecificDetails($application): array
    {
        switch ($application->categoryId) {
            case 'CAT-ILLNESS-INPATIENT':
                return [
                    'reason' => $application->reasonVisitInpatient,
                    'checkInDate' => $application->checkInDate?->format('Y-m-d'),
                    'checkOutDate' => $application->checkOutDate?->format('Y-m-d'),
                    'hospitalDocuments' => $application->hospitalDocumentsPath
                ];
            case 'CAT-EMERGENCY-OTHERS':
                return [
                    'case' => $application->othersCase,
                    'documents' => $application->othersDocumentsPath
                ];
            default:
                return [];
        }
    }

    /**
     * Helper method to get subcategory from category ID
     */
    private function getSubCategoryFromCategory($categoryId): string
    {
        switch ($categoryId) {
            case 'CAT-ILLNESS-INPATIENT':
                return 'inpatient';
            case 'CAT-ILLNESS-OUTPATIENT':
                return 'outpatient';
            case 'CAT-ILLNESS-CHRONIC':
                return 'chronic';
            case 'CAT-EMERGENCY-NATURAL':
                return 'natural';
            case 'CAT-EMERGENCY-FAMILY':
                return 'family';
            case 'CAT-EMERGENCY-OTHERS':
                return 'others';
            default:
                return '';
        }
    }
}