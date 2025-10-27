import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axios';
import { toast } from 'sonner';

// Types
interface AdminApplication {
  applicationId: string;
  userId: string;
  user: {
    name: string;
    email: string;
    studentId: string;
    course: string;
    semester: number;
  };
  categoryId: string;
  category: {
    categoryId: string;
    name: string;
    description: string;
    maxAmount: number;
    requires_committee_approval: boolean;
  };
  documents: Array<{
    documentId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    documentType: string;
    uploadedAt: string;
  }>;
  receipts: Array<{
    receiptId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    receiptNumber: string;
    dateIssued: string;
    description: string;
  }>;
  requestedAmount?: number;
  amountRequested?: number;
  finalAmount: number;
  approvedAmount?: number;
  applicationStatus: string;
  submittedAt: string;
  adminId: string | null;
  adminReviewedAt: string | null;
  adminComments: string | null;
  committeeReviewedAt?: string | null;
  committeeComments?: string | null;
  purpose?: string;
  justification?: string;
  course?: string;
  statusLogs: Array<{
    logId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    remarks: string;
  }>;
}

export type ApproveApplicationData = FormData;

// Export the AdminApplication type for use in components
export type { AdminApplication };

interface RejectApplicationData {
  comments: string;
}

// Get single application details
export function useGetAdminApplication(id: string) {
  return useQuery({
    queryKey: ['adminApplication', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: AdminApplication; message: string }>(
        `/admin/applications/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// Approve application and upload receipt
export function useApproveApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ApproveApplicationData }) => {
      const adminEmail = localStorage.getItem('admin_email');
      const response = await axiosInstance.post<{ data: AdminApplication; message: string }>(
        `/admin/applications/${id}/approve${adminEmail ? `?email=${adminEmail}` : ''}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, { id }) => {
      toast.success('Application approved and receipt uploaded successfully');
      // Invalidate all related queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['adminApplication', id] });
      queryClient.invalidateQueries({ queryKey: ['applicationStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
    },
    onError: (error: any) => {
      // Better error handling for validation errors
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : error.response?.data?.message || 'Failed to approve application';
      toast.error(message);
    },
  });
}

// Reject application
export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RejectApplicationData }) => {
      if (!data.comments?.trim()) {
        throw new Error('Comments are required for rejection');
      }

      const response = await axiosInstance.post<{ data: AdminApplication; message: string }>(
        `/admin/applications/${id}/reject`,
        {
          comments: data.comments.trim(),
          status: 'REJECTED' // Explicitly set the status
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: (data, { id }) => {
      toast.success('Application rejected successfully');
      // Invalidate all related queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['adminApplication', id] });
      queryClient.invalidateQueries({ queryKey: ['applicationStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
    },
    onError: (error: any) => {
      // Better error handling for validation errors
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : error.response?.data?.message || 'Failed to reject application';
      toast.error(message);
    },
  });
}

// Types for statistics
interface ApplicationStatistics {
  total: number;
  pending: number;
  completed: number;
  needReceipt: number;
}

// Get application statistics
export function useGetApplicationStatistics() {
  return useQuery({
    queryKey: ['applicationStatistics'],
    queryFn: async () => {
      const adminEmail = localStorage.getItem('admin_email');
      const { data } = await axiosInstance.get<{ data: ApplicationStatistics; message: string }>(
        '/admin/applications/statistics',
        {
          params: {
            email: adminEmail
          }
        }
      );
      return data.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Get all applications for admin
export function useGetAllApplications() {
  return useQuery({
    queryKey: ['adminApplications'],
    queryFn: async () => {
      const adminEmail = localStorage.getItem('admin_email');
      const { data } = await axiosInstance.get<{ data: AdminApplication[]; message: string }>(
        '/admin/applications',
        {
          params: {
            email: adminEmail
          }
        }
      );
      return data.data;
    },
    retry: false,
    refetchOnWindowFocus: true, // Enable refetch on window focus for real-time updates
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 60000, // Auto-refetch every minute for real-time updates
  });
}