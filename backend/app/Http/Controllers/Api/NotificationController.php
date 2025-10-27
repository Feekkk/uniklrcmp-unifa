<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\UnauthorizedException;

class NotificationController extends ApiController
{
    /**
     * Get all notifications for the authenticated user (supports JWT and email fallback)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $query = Notification::where('userId', $user->id);

            // Filter by read status if specified
            if ($request->has('isRead')) {
                $query->where('isRead', $request->boolean('isRead'));
            }

            $notifications = $query->orderBy('createdAt', 'desc')
                ->paginate($request->input('per_page', 10));

            $unreadCount = Notification::where('userId', $user->id)
                ->where('isRead', false)
                ->count();

            \Log::info('Student notifications retrieved', [
                'userId' => $user->id,
                'email' => $user->email,
                'totalNotifications' => $notifications->total(),
                'unreadCount' => $unreadCount
            ]);

            return $this->successResponse([
                'notifications' => $notifications->items(),
                'total' => $notifications->total(),
                'unread_count' => $unreadCount
            ], 'Notifications retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Error retrieving notifications:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error retrieving notifications: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific notification (supports JWT and email fallback)
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $notification = Notification::where('notificationId', $id)
                ->where('userId', $user->id)
                ->first();

            if (!$notification) {
                throw new ResourceNotFoundException('Notification not found');
            }

            return $this->successResponse($notification, 'Notification retrieved successfully');
        } catch (ResourceNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\Exception $e) {
            \Log::error('Error retrieving notification:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error retrieving notification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark a notification as read and delete it from database (supports JWT and email fallback)
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $notification = Notification::where('notificationId', $id)
                ->where('userId', $user->id)
                ->first();

            if (!$notification) {
                throw new ResourceNotFoundException('Notification not found');
            }

            // Store notification data before deletion for response
            $notificationData = $notification->toArray();

            // Delete the notification instead of marking as read
            $notification->delete();

            \Log::info('Notification marked as read and deleted', [
                'userId' => $user->id,
                'notificationId' => $id
            ]);

            return $this->successResponse($notificationData, 'Notification marked as read and removed');
        } catch (ResourceNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\Exception $e) {
            \Log::error('Error marking notification as read:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error updating notification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark all notifications as read and delete them from database (supports JWT and email fallback)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            // Count notifications before deletion
            $count = Notification::where('userId', $user->id)->count();

            // Delete all notifications for the user
            $deleted = Notification::where('userId', $user->id)->delete();

            \Log::info('All notifications marked as read and deleted', [
                'userId' => $user->id,
                'deletedCount' => $deleted
            ]);

            return $this->successResponse(['deleted_count' => $deleted], 'All notifications marked as read and removed');
        } catch (\Exception $e) {
            \Log::error('Error marking all notifications as read:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error updating notifications: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a notification (supports JWT and email fallback)
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $notification = Notification::where('notificationId', $id)
                ->where('userId', $user->id)
                ->first();

            if (!$notification) {
                throw new ResourceNotFoundException('Notification not found');
            }

            $notification->delete();

            \Log::info('Notification deleted', [
                'userId' => $user->id,
                'notificationId' => $id
            ]);

            return $this->successResponse(null, 'Notification deleted successfully');
        } catch (ResourceNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting notification:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error deleting notification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete all notifications for the user (supports JWT and email fallback)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteAll(Request $request): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $deleted = Notification::where('userId', $user->id)->delete();

            \Log::info('All notifications deleted', [
                'userId' => $user->id,
                'deletedCount' => $deleted
            ]);

            return $this->successResponse(['deleted_count' => $deleted], 'All notifications deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Error deleting all notifications:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error deleting notifications: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get unread notification count (supports JWT and email fallback)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        try {
            // Get user from JWT or email parameter
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return $this->errorResponse('Unauthorized - User not found', 401);
            }

            $count = Notification::where('userId', $user->id)
                ->where('isRead', false)
                ->count();

            return $this->successResponse(['count' => $count], 'Unread count retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Error getting unread count:', ['error' => $e->getMessage()]);
            return $this->errorResponse('Error getting unread count: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper method to get authenticated user from JWT or email parameter
     * 
     * @param Request $request
     * @return User|null
     */
    private function getAuthenticatedUser(Request $request): ?User
    {
        // Try to get user from JWT first
        $user = Auth::user();
        
        if ($user) {
            return $user;
        }

        // Fallback to email parameter (for student email-based authentication)
        if ($request->filled('email')) {
            $email = $request->input('email');
            $user = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
            
            if ($user) {
                \Log::info('User authenticated via email fallback', [
                    'email' => $email,
                    'userId' => $user->id
                ]);
                return $user;
            }
        }

        return null;
    }
}