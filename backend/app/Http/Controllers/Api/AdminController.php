<?php

namespace App\Http\Controllers\Api;

use App\Models\Admin;
use App\Models\Application;
use App\Models\Receipt;
use App\Models\Notification;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AdminController extends ApiController
{
    /**
     * Get the admin's profile using email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getProfile(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $admin = Admin::where('email', $request->email)->first();
        
        if (!$admin) {
            return $this->errorResponse('Admin not found', 404);
        }

        return $this->successResponse([
            'id' => $admin->id,
            'username' => $admin->username,
            'email' => $admin->email,
            'created_at' => $admin->created_at,
            'updated_at' => $admin->updated_at
        ], 'Admin profile retrieved successfully');
    }

    /**
     * Update the admin's profile using email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'username' => 'required|string|max:255',
        ]);

        $admin = Admin::where('email', $validated['email'])->first();
        
        if (!$admin) {
            return $this->errorResponse('Admin not found', 404);
        }

        $admin->update([
            'username' => $validated['username']
        ]);

        return $this->successResponse([
            'id' => $admin->id,
            'username' => $admin->username,
            'email' => $admin->email,
            'updated_at' => $admin->updated_at
        ], 'Admin profile updated successfully');
    }

    /**
     * Change the admin's password using email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|same:new_password'
        ]);

        $admin = Admin::where('email', $validated['email'])->first();
        
        if (!$admin) {
            return $this->errorResponse('Admin not found', 404);
        }

        // Check if current password is correct
        if (!Hash::check($validated['current_password'], $admin->password)) {
            return $this->errorResponse('Current password is incorrect', 422);
        }

        // Update password
        Admin::where('email', $validated['email'])->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return $this->successResponse(null, 'Password changed successfully');
    }
    
    /**
     * Get all applications for admin review
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getApplications(Request $request): JsonResponse
    {
        // Check admin authentication - either JWT or email parameter
        $admin = null;
        
        // If we have an email in the request, use it for fallback authentication
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
            
            // Log fallback authentication
            \Log::info('Admin authenticated with email fallback', [
                'email' => $request->email,
                'admin_id' => $admin->id,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        } else {
            // JWT authentication should already be handled by middleware
            // But we'll check it again here to be safe
            if (!Auth::guard('admin')->check() && !Auth::check()) {
                return $this->errorResponse('Unauthorized access', 401);
            }
            
            // Log JWT authentication
            \Log::info('Admin authenticated with JWT token', [
                'admin_id' => Auth::guard('admin')->id() ?? Auth::id(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        }
        
        // Get all applications with related data
        try {
            $applications = Application::with([
                'user',
                'category',
                'documents',
                'statusLogs',
                'committee'
            ])->orderBy('submittedAt', 'desc')->get();
            
            return $this->successResponse(
                $applications,
                'All applications retrieved successfully'
            );
        } catch (\Exception $e) {
            \Log::error('Error retrieving applications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Error retrieving applications: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get details of a specific application
     *
     * @param string $id
     * @return JsonResponse
     */
    public function getApplication(string $id): JsonResponse
    {
        $application = Application::with([
            'user',
            'category',
            'documents',
            'statusLogs',
            'committee',
            'receipts'
        ])->where('applicationId', $id)->first();
        
        if (!$application) {
            return $this->errorResponse('Application not found', 404);
        }
        
        return $this->successResponse(
            $application,
            'Application details retrieved successfully'
        );
    }
    
    /**
     * Approve an application
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function approveApplication(Request $request, string $id): JsonResponse
    {
        // First verify admin authentication
        $adminId = null;
        
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found', 404);
            }
            $adminId = $admin->id;
        } else if (Auth::guard('admin')->check()) {
            $adminId = Auth::guard('admin')->id();
        } else {
            return $this->errorResponse('Unauthorized', 401);
        }

        // Fetch the application first to determine validation rules
        $application = Application::with('category')->where('applicationId', $id)->first();
        
        if (!$application) {
            return $this->errorResponse('Application not found', 404);
        }

        // For special categories, receipt is required. For others, approvedAmount is required
        $specialCategories = ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'];
        $isSpecialCategory = in_array($application->categoryId, $specialCategories);
        
        if ($isSpecialCategory) {
            // For committee-approved applications, only receipt and comments are required
            $validated = $request->validate([
                'receipt' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
                'comments' => 'nullable|string',
            ]);
        } else {
            // For regular applications, approvedAmount and receipt are required
            $validated = $request->validate([
                'approvedAmount' => 'required|numeric|min:0',
                'receipt' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
                'comments' => 'nullable|string',
            ]);
        }
        
        // Check if application is in special categories that require committee approval first
        $specialCategories = ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'];
        if (in_array($application->categoryId, $specialCategories)) {
            if ($application->applicationStatus !== 'committee_approved') {
                return $this->errorResponse(
                    'This application requires committee approval before admin can upload receipt and finalize approval',
                    422
                );
            }
        }

        try {
            // Begin transaction
            \DB::beginTransaction();
            
            // Store receipt
            $path = $request->file('receipt')->store('receipts');
            
            // Create receipt record
            $receipt = Receipt::create([
                'receiptId' => 'RCP-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'applicationId' => $id,
                'uploadedBy' => $adminId, // Use the verified admin ID
                'fileName' => $path,
                'originalFileName' => $request->file('receipt')->getClientOriginalName(),
                'filePath' => $path,
                'fileType' => $request->file('receipt')->getMimeType(),
                'fileSize' => $request->file('receipt')->getSize(),
                'uploadedAt' => now(),
                'description' => $validated['comments'] ?? 'Payment receipt uploaded by admin',
                'status' => 'ACTIVE'
            ]);
            
            // Update the application
            $updateData = [
                'applicationStatus' => 'approved', // Final approved status
                'adminId' => $adminId, // Use the verified admin ID
                'adminReviewedAt' => now(),
                'adminComments' => $validated['comments'],
                'updatedAt' => now()
            ];
            
            // For regular applications, set the approved amount
            if (!$isSpecialCategory) {
                $updateData['approvedAmount'] = $validated['approvedAmount'];
            }
            // For special categories, keep the committee-approved amount
            
            $application->update($updateData);
            
            // Log the status change
            $application->statusLogs()->create([
                'logId' => 'LOG-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'previousStatus' => $application->applicationStatus,
                'newStatus' => 'approved',
                'changedBy' => $adminId, // Use the verified admin ID
                'changedAt' => now(),
                'remarks' => $validated['comments'] ?? ($isSpecialCategory ? 'Payment receipt uploaded by admin - application finalized' : 'Application approved by admin with payment receipt uploaded')
            ]);

            // Create notification for student
            $approvedAmount = $isSpecialCategory ? $application->approvedAmount : $validated['approvedAmount'];
            Notification::create([
                'notificationId' => 'NOTIF-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'userId' => $application->userId,
                'applicationId' => $application->applicationId, // Add the applicationId
                'title' => 'Application Approved',
                'message' => "Your application (ID: {$application->applicationId}) has been approved. The approved amount is RM{$approvedAmount}.",
                'type' => 'APPLICATION_APPROVED',
                'status' => 'UNREAD',
                'createdAt' => now()
            ]);

            // Automatically create welfare fund transaction for approved application
            try {
                $financeController = new \App\Http\Controllers\Api\FinanceController();
                $transactionCreated = $financeController->createApprovalTransaction(
                    $application->applicationId,
                    $approvedAmount,
                    $adminId
                );
                
                if (!$transactionCreated) {
                    \Log::warning("Failed to create automatic transaction for approved application {$application->applicationId}");
                } else {
                    \Log::info("Successfully created automatic transaction for approved application {$application->applicationId}");
                }
            } catch (\Exception $e) {
                \Log::error("Error creating automatic transaction for application {$application->applicationId}: " . $e->getMessage());
                // Don't fail the entire approval process if transaction creation fails
            }

            \DB::commit();

            return $this->successResponse(
                $application->load(['user', 'category', 'statusLogs', 'receipts']),
                'Application approved successfully'
            );
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error approving application:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to approve application: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Reject an application
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function rejectApplication(Request $request, string $id): JsonResponse
    {
        // First verify admin authentication (same logic as approveApplication)
        $adminId = null;
        
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found', 404);
            }
            $adminId = $admin->id;
        } else if (Auth::guard('admin')->check()) {
            $adminId = Auth::guard('admin')->id();
        } else {
            return $this->errorResponse('Unauthorized', 401);
        }

        $validated = $request->validate([
            'comments' => 'required|string',
        ]);
        
        $application = Application::with('category')->where('applicationId', $id)->first();
        
        if (!$application) {
            return $this->errorResponse('Application not found', 404);
        }
        
        // Check if application is in special categories that require committee approval first
        $specialCategories = ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'];
        if (in_array($application->categoryId, $specialCategories)) {
            if ($application->applicationStatus !== 'committee_approved') {
                return $this->errorResponse(
                    'This application requires committee approval before admin can make a decision',
                    422
                );
            }
        }
        
        try {
            \DB::beginTransaction();
            
            // Update the application
            $application->update([
                'applicationStatus' => 'REJECTED',
                'adminId' => $adminId, // Use the verified admin ID
                'adminReviewedAt' => now(),
                'adminComments' => $validated['comments'],
                'updatedAt' => now()
            ]);
            
            // Log the status change
            $application->statusLogs()->create([
                'logId' => 'LOG-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'previousStatus' => $application->applicationStatus,
                'newStatus' => 'REJECTED',
                'changedBy' => $adminId, // Use the verified admin ID
                'changedAt' => now(),
                'remarks' => $validated['comments']
            ]);
            
            // Create notification for student
            Notification::create([
                'notificationId' => 'NOTIF-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'userId' => $application->userId,
                'applicationId' => $application->applicationId,
                'title' => 'Application Rejected',
                'message' => "Your application (ID: {$application->applicationId}) has been rejected.",
                'type' => 'APPLICATION_REJECTED',
                'status' => 'UNREAD',
                'createdAt' => now()
            ]);

            \DB::commit();
            
            return $this->successResponse(
                $application->load(['user', 'category', 'statusLogs']),
                'Application rejected successfully'
            );
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error rejecting application:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to reject application: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all registered users (students and committee members) in the system
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAllUsers(Request $request): JsonResponse
    {
        // Check admin authentication - either JWT or email parameter
        $admin = null;
        
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found', 404);
            }
        } else if (!Auth::guard('admin')->check()) {
            return $this->errorResponse('Unauthorized', 401);
        }

        try {
            // Get all students
            $students = \App\Models\User::select('id', 'name', 'email', 'created_at', 'updated_at')
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'type' => 'student',
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at
                    ];
                });

            // Get all committee members
            $committee = \App\Models\Committee::select('id', 'name', 'email', 'created_at', 'updated_at')
                ->get()
                ->map(function($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'type' => 'committee',
                        'created_at' => $member->created_at,
                        'updated_at' => $member->updated_at
                    ];
                });

            // Combine and return both collections
            $allUsers = $students->concat($committee);

            return $this->successResponse([
                'users' => $allUsers,
                'total' => $allUsers->count(),
                'students_count' => $students->count(),
                'committee_count' => $committee->count()
            ], 'Users retrieved successfully');
            
        } catch (\Exception $e) {
            \Log::error('Error retrieving users: ' . $e->getMessage());
            return $this->errorResponse('Error retrieving users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update student details (name, email, password)
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function updateStudent(Request $request, string $id): JsonResponse
    {
        // Debug request
        \Log::info('Update student request:', [
            'query_params' => $request->query(),
            'request_body' => $request->all(),
            'headers' => $request->header()
        ]);

        // Check admin authentication - either JWT or email parameter
        $admin = null;
        $adminEmail = $request->query('email') ?? $request->input('admin_email');

        // If we have an admin email, use it for fallback authentication
        if ($adminEmail) {
            $admin = Admin::where('email', $adminEmail)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
            
            // Log fallback authentication
            \Log::info('Admin authenticated with email fallback for student update', [
                'email' => $adminEmail,
                'admin_id' => $admin->id,
                'student_id' => $id
            ]);
        } else {
            // JWT authentication should already be handled by middleware
            if (!Auth::guard('admin')->check() && !Auth::check()) {
                return $this->errorResponse('Unauthorized access', 401);
            }
            
            // Log JWT authentication
            \Log::info('Admin authenticated with JWT token for student update', [
                'admin_id' => Auth::guard('admin')->id() ?? Auth::id(),
                'student_id' => $id
            ]);
        }

        // Remove admin_email from validation if it exists in request
        $requestData = $request->except(['admin_email']);
        
        $validated = $this->validate($request, [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|required|string|min:8|confirmed'
        ]);

        $student = \App\Models\User::find($id);
        
        if (!$student) {
            return $this->errorResponse('Student not found', 404);
        }

        $updateData = [];
        
        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }
        
        if (isset($validated['email'])) {
            $updateData['email'] = $validated['email'];
        }
        
        if (isset($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $student->update($updateData);

        return $this->successResponse([
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'updated_at' => $student->updated_at
        ], 'Student details updated successfully');
    }

    /**
     * Update a committee member account
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function updateCommittee(Request $request, string $id): JsonResponse
    {
        // Debug request
        \Log::info('Update committee request:', [
            'query_params' => $request->query(),
            'request_body' => $request->all(),
            'headers' => $request->header()
        ]);

        // Check admin authentication - either JWT or email parameter
        $admin = null;
        $adminEmail = $request->query('email') ?? $request->input('admin_email');

        // If we have an admin email, use it for fallback authentication
        if ($adminEmail) {
            $admin = Admin::where('email', $adminEmail)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
            
            // Log fallback authentication
            \Log::info('Admin authenticated with email fallback for committee update', [
                'email' => $adminEmail,
                'admin_id' => $admin->id,
                'committee_id' => $id
            ]);
        } else {
            // JWT authentication should already be handled by middleware
            if (!Auth::guard('admin')->check() && !Auth::check()) {
                return $this->errorResponse('Unauthorized access', 401);
            }
            
            // Log JWT authentication
            \Log::info('Admin authenticated with JWT token for committee update', [
                'admin_id' => Auth::guard('admin')->id() ?? Auth::id(),
                'committee_id' => $id
            ]);
        }

        // Remove admin_email from validation if it exists in request
        $requestData = $request->except(['admin_email']);
        
        $validated = $this->validate($request, [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:committees,email,' . $id,
            'password' => 'sometimes|required|string|min:8|confirmed'
        ]);

        $committee = \App\Models\Committee::find($id);
        
        if (!$committee) {
            return $this->errorResponse('Committee member not found', 404);
        }

        $updateData = [];
        
        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }
        
        if (isset($validated['email'])) {
            $updateData['email'] = $validated['email'];
        }
        
        if (isset($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $committee->update($updateData);

        return $this->successResponse([
            'id' => $committee->id,
            'name' => $committee->name,
            'email' => $committee->email,
            'updated_at' => $committee->updated_at
        ], 'Committee member details updated successfully');
    }

    /**
     * Delete a student account from the system
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function deleteStudent(Request $request, string $id): JsonResponse
    {
        // Check admin authentication
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
        } else if (!Auth::guard('admin')->check() && !Auth::check()) {
            return $this->errorResponse('Unauthorized access', 401);
        }

        $student = \App\Models\User::find($id);
        
        if (!$student) {
            return $this->errorResponse('Student not found', 404);
        }

        try {
            // Begin transaction to ensure all related data is deleted properly
            \DB::beginTransaction();

            // Delete related applications and their associated data
            $applications = Application::where('userId', $id)->get();
            foreach ($applications as $application) {
                // Delete related documents
                $application->documents()->delete();
                
                // Delete status logs
                $application->statusLogs()->delete();
                
                // Delete receipts
                $application->receipts()->delete();
                
                // Finally delete the application
                $application->delete();
            }

            // Delete the student account
            $student->delete();

            \DB::commit();

            return $this->successResponse(null, 'Student account and all related data deleted successfully');
        } catch (\Exception $e) {
            \DB::rollBack();
            
            \Log::error('Error deleting student account', [
                'student_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Error deleting student account: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a committee member account from the system
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function deleteCommittee(Request $request, string $id): JsonResponse
    {
        // Check admin authentication
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
        } else if (!Auth::guard('admin')->check() && !Auth::check()) {
            return $this->errorResponse('Unauthorized access', 401);
        }

        $committee = \App\Models\Committee::find($id);
        
        if (!$committee) {
            return $this->errorResponse('Committee member not found', 404);
        }

        try {
            // Begin transaction to ensure all related data is handled properly
            \DB::beginTransaction();

            // Check if committee member has reviewed any applications
            $reviewedApplications = Application::where('committeeId', $id)->count();
            
            if ($reviewedApplications > 0) {
                // If committee member has reviewed applications, we should not delete them
                // Instead, we could deactivate the account or transfer reviews
                \DB::rollBack();
                return $this->errorResponse(
                    'Cannot delete committee member who has reviewed applications. Please contact system administrator.',
                    422
                );
            }

            // Delete the committee account
            $committee->delete();

            \DB::commit();

            return $this->successResponse(null, 'Committee member account deleted successfully');
        } catch (\Exception $e) {
            \DB::rollBack();
            
            \Log::error('Error deleting committee member account', [
                'committee_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Error deleting committee member account: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get applications that need receipt upload by admin (committee-approved applications)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getApplicationsNeedingReceipt(Request $request): JsonResponse
    {
        // Check admin authentication (reuse existing logic from getApplications)
        $admin = null;
        
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
        } else {
            if (!Auth::guard('admin')->check() && !Auth::check()) {
                return $this->errorResponse('Unauthorized access', 401);
            }
            $admin = Auth::guard('admin')->user() ?? Auth::user();
        }

        try {
            // Get committee-approved applications that need receipt upload
            $applications = Application::with([
                'user',
                'category',
                'documents',
                'statusLogs',
                'committee'
            ])
            ->where('applicationStatus', 'committee_approved')
            ->whereIn('categoryId', ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'])
            ->orderBy('committeeReviewedAt', 'desc')
            ->get();
            
            return $this->successResponse(
                $applications,
                'Applications needing receipt upload retrieved successfully'
            );
        } catch (\Exception $e) {
            \Log::error('Error retrieving applications needing receipt', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Error retrieving applications needing receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get application statistics for admin dashboard
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getApplicationStatistics(Request $request): JsonResponse
    {
        // Check admin authentication (reuse existing logic from getApplications)
        $admin = null;
        if ($request->has('email')) {
            $admin = Admin::where('email', $request->email)->first();
            if (!$admin) {
                return $this->errorResponse('Admin not found with the provided email', 401);
            }
        } else {
            if (!Auth::guard('admin')->check() && !Auth::check()) {
                return $this->errorResponse('Unauthorized access', 401);
            }
            $admin = Auth::guard('admin')->user() ?? Auth::user();
        }

        try {
            $total = Application::count();
            $pending = Application::whereIn('applicationStatus', ['SUBMITTED', 'committee_approved'])->count();
            $completed = Application::where('applicationStatus', 'approved')->count();
            $needReceipt = Application::where('applicationStatus', 'committee_approved')
                ->whereDoesntHave('receipts')  // Assuming receipts relationship exists
                ->count();

            return $this->successResponse([
                'total' => $total,
                'pending' => $pending,
                'completed' => $completed,
                'needReceipt' => $needReceipt
            ], 'Application statistics retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Error retrieving application statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Error retrieving statistics: ' . $e->getMessage(), 500);
        }
    }
}