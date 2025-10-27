<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\Auth\AdminAuthController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\CommitteeAuthController;
use App\Http\Controllers\Api\FundingCategoryController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ApplicationDocumentController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CommitteeController;
use App\Http\Controllers\Api\FinanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    // Public routes
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::get('profile', [AuthController::class, 'getProfile']);
    
    // Committee auth routes
    Route::prefix('committee')->group(function () {
        Route::get('/profile', [CommitteeAuthController::class, 'getProfile']);
        Route::post('/profile/update', [CommitteeAuthController::class, 'updateProfile']);
        Route::post('/password/change', [CommitteeAuthController::class, 'changePassword']);
    });
    
    // Protected routes requiring JWT
    Route::middleware('jwt.auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Funding Categories Routes
Route::prefix('funding-categories')->group(function () {
    Route::get('/', [FundingCategoryController::class, 'index']);
    Route::get('/{id}', [FundingCategoryController::class, 'show']);
    
    // Protected routes - Admin only
    Route::middleware('auth:admin')->group(function () {
        Route::post('/', [FundingCategoryController::class, 'store']);
        Route::put('/{id}', [FundingCategoryController::class, 'update']);
        Route::delete('/{id}', [FundingCategoryController::class, 'destroy']);
    });
});

// Applications Routes
Route::prefix('applications')->group(function () {
    // Export routes - must come before /{id} route to avoid conflicts
    Route::get('/export', [ApplicationController::class, 'exportApplications']);
    Route::get('/export-pdf', [ApplicationController::class, 'exportApplicationsPdf']);
    
    // Public routes
    Route::get('/', [ApplicationController::class, 'index']);
    Route::post('/', [ApplicationController::class, 'store']);
    Route::post('/financial-aid', [ApplicationController::class, 'storeFinancialAid']);
    Route::get('/{id}/edit', [ApplicationController::class, 'getApplicationForEdit'])->name('applications.edit')->middleware('jwt.auth');
    Route::put('/{id}/documents', [ApplicationController::class, 'updateDocuments'])->middleware('jwt.auth');
    Route::post('/{id}/documents', [ApplicationController::class, 'updateDocuments'])->middleware('jwt.auth'); // Add POST as alternative
    Route::delete('/{applicationId}/documents/{documentId}', [ApplicationController::class, 'deleteDocument'])->middleware('jwt.auth');
    Route::get('/{id}', [ApplicationController::class, 'show']);
    Route::put('/{id}', [ApplicationController::class, 'update']);
    
    // Documents (removed duplicate POST route - already handled above)
    // Route::post('/{id}/documents', [ApplicationDocumentController::class, 'store']); // REMOVED - conflicts with updateDocuments route
    Route::delete('/documents/{id}', [ApplicationDocumentController::class, 'destroy']);
    Route::get('/documents/{id}/view', [ApplicationDocumentController::class, 'viewDocument']);
    Route::get('/documents/{id}/download', [ApplicationDocumentController::class, 'downloadDocument']);
    
    // Receipts - Admin only
    Route::post('/{id}/receipts', [ReceiptController::class, 'store'])->middleware('jwt.auth');
    Route::get('/{id}/receipts', [ReceiptController::class, 'index']);
    Route::get('/receipts/{id}/view', [ReceiptController::class, 'viewReceipt']);
    Route::get('/receipts/{id}/download', [ReceiptController::class, 'downloadReceipt']);
});

// Notifications - Support both JWT and email fallback authentication
Route::prefix('notifications')->group(function () {
    // Public routes that support email parameter for student authentication
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::get('/{id}', [NotificationController::class, 'show']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/', [NotificationController::class, 'deleteAll']);
});

// Dashboard Summary
Route::get('dashboard/summary', [DashboardController::class, 'summary']);

// Finance Routes - Welfare Fund Management
Route::prefix('finance')->group(function () {
    
    // Public routes for viewing finance data
    Route::get('/welfare-fund/balance', [FinanceController::class, 'getCurrentBalance']);
    Route::get('/welfare-fund/transactions', [FinanceController::class, 'getTransactions']);
    Route::get('/welfare-fund/all-transactions', [FinanceController::class, 'getAllTransactions']);
    Route::get('/welfare-fund/summary', [FinanceController::class, 'getSummary']);
    Route::get('/student-application-stats', [FinanceController::class, 'getStudentApplicationStats']);
    
    // Routes that support both JWT and email authentication (same pattern as admin)
    Route::post('/welfare-fund/transaction', [FinanceController::class, 'createTransaction']);
    Route::put('/welfare-fund/transaction/{id}', [FinanceController::class, 'updateTransaction']);
    Route::delete('/welfare-fund/transaction/{id}', [FinanceController::class, 'deleteTransaction']);
    Route::get('/welfare-fund/export', [FinanceController::class, 'exportTransactions']);
    Route::get('/welfare-fund/export-pdf', [FinanceController::class, 'exportTransactionsPdf']);
});

// Admin Routes
Route::prefix('admin')->group(function () {
    // Public routes that can work with email parameter for admin
    Route::get('profile', [AdminController::class, 'getProfile']);
    Route::put('profile', [AdminController::class, 'updateProfile']);
    Route::post('change-password', [AdminController::class, 'changePassword']);
    Route::get('applications/statistics', [AdminController::class, 'getApplicationStatistics']);
    Route::get('applications', [AdminController::class, 'getApplications']);
    Route::get('applications/needing-receipt', [AdminController::class, 'getApplicationsNeedingReceipt']);
    Route::get('applications/{id}', [AdminController::class, 'getApplication']);
    
    // Routes that support both JWT and email authentication
    Route::post('applications/{id}/approve', [AdminController::class, 'approveApplication']);
    Route::post('applications/{id}/reject', [AdminController::class, 'rejectApplication']);
    Route::get('users', [AdminController::class, 'getAllUsers']);
    Route::put('students/{id}', [AdminController::class, 'updateStudent']);
    Route::delete('students/{id}', [AdminController::class, 'deleteStudent']);
    Route::put('committees/{id}', [AdminController::class, 'updateCommittee']);
    Route::delete('committees/{id}', [AdminController::class, 'deleteCommittee']);
});

// Committee Routes - Consistent with admin approach
Route::prefix('committee')->group(function () {
    // Public routes that can work with email parameter for committee (same pattern as admin)
    Route::get('profile', [CommitteeController::class, 'getProfile']);
    Route::get('applications', [CommitteeController::class, 'getEligibleApplications']);
    Route::get('applications/{id}', [CommitteeController::class, 'getApplication']);
    Route::get('dashboard/stats', [CommitteeController::class, 'getDashboardStats']);
    
    // Routes that support both JWT and email authentication (same pattern as admin)
    Route::post('applications/{id}/approve', [CommitteeController::class, 'approveApplication']);
    Route::post('applications/{id}/reject', [CommitteeController::class, 'rejectApplication']);
    Route::put('profile', [CommitteeAuthController::class, 'updateProfile']);
    Route::post('change-password', [CommitteeAuthController::class, 'changePassword']);
});