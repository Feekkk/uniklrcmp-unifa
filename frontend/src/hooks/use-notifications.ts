import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Notification {
  notificationId: string;
  userId: number;
  applicationId: string;
  title: string;
  message: string;
  type: 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'COMMITTEE_APPROVED' | 'COMMITTEE_REJECTED';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const useNotifications = () => {
  const studentEmail = localStorage.getItem('student_email') || '';
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', studentEmail],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/notifications`, {
        params: { email: studentEmail }
      });
      // Since marking as read now deletes notifications, we show all notifications
      const notifications = response.data.data.notifications || [];
      return {
        ...response.data.data,
        notifications: notifications
      };
    },
    enabled: !!studentEmail,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread', studentEmail],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/notifications/unread-count`, {
        params: { email: studentEmail }
      });
      return response.data.data.count;
    },
    enabled: !!studentEmail,
    staleTime: 30000,
    refetchInterval: 30000
  });

  // Mark as read mutation (now deletes the notification from database)
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return axios.put(
        `${API_BASE}/notifications/${notificationId}/read`,
        {},
        { params: { email: studentEmail } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentEmail] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', studentEmail] });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return axios.delete(
        `${API_BASE}/notifications/${notificationId}`,
        { params: { email: studentEmail } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentEmail] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', studentEmail] });
    }
  });

  // Mark all as read mutation (now deletes all notifications from database)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return axios.post(
        `${API_BASE}/notifications/mark-all-read`,
        {},
        { params: { email: studentEmail } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentEmail] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', studentEmail] });
    }
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      return axios.delete(`${API_BASE}/notifications`, {
        params: { email: studentEmail }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentEmail] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', studentEmail] });
    }
  });

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: unreadData || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingAll: deleteAllNotificationsMutation.isPending
  };
};
