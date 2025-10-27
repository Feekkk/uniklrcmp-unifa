<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\ApplicationStatusLog;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function summary(): JsonResponse
    {
        // Public demo: derive userId from email query or fallback to auth
        $userId = Auth::id();
        if (request()->has('email')) {
            $email = request()->query('email');
            $user = \App\Models\User::where('email', $email)->first();
            $userId = $user?->id;
            \Log::info('Dashboard query - Email: ' . $email . ', User found: ' . ($user ? 'Yes' : 'No') . ', UserId: ' . $userId);
        }

        // Fetch user applications
        $applicationsQuery = Application::query();
        if ($userId) {
            $applicationsQuery->where('userId', $userId);
        } else {
            // No user context: return zeros
            return $this->successResponse([
                'stats' => [
                    'activeApplications' => 0,
                    'totalApplications' => 0,
                    'approvedAmount' => 0.0,
                    'pendingAmount' => 0.0,
                ],
                'recentActivity' => [],
                'notifications' => [],
            ], 'Dashboard summary retrieved successfully');
        }

        $totalApplications = (clone $applicationsQuery)->count();
        $activeApplications = (clone $applicationsQuery)
            ->whereIn('applicationStatus', ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'])
            ->count();
            
        \Log::info('Dashboard stats - UserId: ' . $userId . ', Total: ' . $totalApplications . ', Active: ' . $activeApplications);

        // Amounts
        $approvedAmount = (clone $applicationsQuery)
            ->whereNotNull('approvedAmount')
            ->sum('approvedAmount');

        $pendingAmount = (clone $applicationsQuery)
            ->whereIn('applicationStatus', ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'])
            ->sum('amountRequested');

        // Recent activity from status logs
        $recentActivity = ApplicationStatusLog::whereIn('applicationId', function ($q) use ($userId) {
                $q->select('applicationId')->from('applications')->where('userId', $userId);
            })
            ->orderBy('changedAt', 'desc')
            ->limit(10)
            ->get();

        // Notifications (latest 10)
        $notifications = Notification::where('userId', $userId)
            ->orderBy('createdAt', 'desc')
            ->limit(10)
            ->get();

        return $this->successResponse([
            'stats' => [
                'activeApplications' => (int) $activeApplications,
                'totalApplications' => (int) $totalApplications,
                'approvedAmount' => (float) $approvedAmount,
                'pendingAmount' => (float) $pendingAmount,
            ],
            'recentActivity' => $recentActivity,
            'notifications' => $notifications,
        ], 'Dashboard summary retrieved successfully');
    }
}


