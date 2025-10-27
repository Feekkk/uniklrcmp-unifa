import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from './axios';
import { getUserEmailFromToken, getUserRoleFromToken } from '../jwt-utils';

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await axiosInstance.post('/auth/login', credentials);
      return data; // This will directly return the response data
    },
  });
};

export function useRegister() {
  return useMutation({
    mutationFn: async (data: {
      username: string;
      fullName: string;
      email: string;
      bankName: string;
      bankAccount: string;
      password: string;
      password_confirmation: string;
    }) => {
      const { data: responseData } = await axiosInstance.post('/auth/register', data);
      return responseData;
    },
  });
}

// Student hooks
export const useSubmitApplication = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Check if email is already in FormData (to avoid double-appending)
      const hasEmail = formData.has('email');
      
      // Only get and append email from JWT if not already present
      if (!hasEmail) {
        const email = getUserEmailFromToken();
        if (email) {
          console.log('Adding email from JWT token:', email);
          formData.append('email', email);
        }
      } else {
        console.log('Email already present in FormData');
      }
      
      const { data } = await axiosInstance.post('/applications/financial-aid', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
};

export const useGetApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const email = getUserEmailFromToken();
      const params = email ? { email } : {};
      console.log('useGetApplications - Email from token:', email);
      console.log('useGetApplications - Request params:', params);
      const { data } = await axiosInstance.get('/applications', { params });
      console.log('useGetApplications - Response data:', data);
      return data;
    },
  });
};

export const useGetApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/applications/${applicationId}`);
      return data;
    },
    enabled: !!applicationId,
  });
};

export const useGetStudentApplications = () => {
  return useQuery({
    queryKey: ['studentApplications'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/student/applications');
      return data;
    },
  });
};

// Committee hooks
export const useGetPendingApplications = () => {
  return useQuery({
    queryKey: ['pendingApplications'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/committee/pending-applications');
      return data;
    },
  });
};

export const useReviewApplication = () => {
  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      comments,
    }: {
      applicationId: number;
      status: 'approved' | 'rejected';
      comments: string;
    }) => {
      const { data } = await axiosInstance.post(`/committee/review/${applicationId}`, {
        status,
        comments,
      });
      return data;
    },
  });
};

// Admin hooks
export const useGetAllApplications = () => {
  return useQuery({
    queryKey: ['allApplications'],
    queryFn: async () => {
      try {
        // Get authentication info
        const token = localStorage.getItem('access_token');
        const adminEmail = localStorage.getItem('admin_email');
        
        // Detailed logging to diagnose the issue
        console.log('Admin Applications API Request:');
        console.log('- Token exists:', !!token);
        console.log('- Admin email exists:', !!adminEmail);
        
        // Create params object for email-based auth
        const params: Record<string, string> = {};
        if (adminEmail && !token) {
          params.email = adminEmail;
        }
        
        // Create headers object for additional debug info
        const headers: Record<string, string> = {
          'X-Debug-Token-Present': token ? 'yes' : 'no',
          'X-Debug-Admin-Email': adminEmail || 'none',
          'X-Debug-Client': 'ReactApp'
        };
        
        // If we have admin email but no token, add it to headers too
        if (adminEmail && !token) {
          headers['X-Admin-Email'] = adminEmail;
        }
        
        // Make the request with appropriate authentication
        console.log('Sending request to /admin/applications with:', { params, headers });
        
        const response = await axiosInstance.get('/admin/applications', {
          params,
          headers
        });
        
        console.log('Admin applications response successful:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataLength: response.data?.data?.length || 0
        });
        
        return response.data;
      } catch (error: any) {
        // Enhanced error logging
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
          requestConfig: error.config ? {
            url: error.config.url,
            method: error.config.method,
            baseURL: error.config.baseURL,
            params: error.config.params,
            headers: error.config.headers ? {
              ...Object.keys(error.config.headers).reduce((acc, key) => {
                acc[key] = key.toLowerCase().includes('auth') ? 'REDACTED' : error.config.headers[key];
                return acc;
              }, {} as Record<string, string>)
            } : 'No headers'
          } : 'No config'
        };
        
        console.error('Admin applications error details:', errorDetails);
        
        // Don't redirect to login page automatically - let the component handle it
        if (error.response?.status === 401) {
          console.error('Authentication error: 401 Unauthorized');
        }
        
        throw error;
      }
    },
    retry: 1, // Reduce retries for debugging
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep data in cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

export const useGetUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('Fetching user profile...');
      const { data } = await axiosInstance.get(`/auth/profile`);
      console.log('User profile response:', data);
      return data;
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // Keep data in cache for 1 minute
  });
};

export const useGetDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const email = getUserEmailFromToken();
      const params = email ? { email } : {};
      console.log('Dashboard summary request - Email:', email, 'Params:', params);
      
      try {
        const { data } = await axiosInstance.get('/dashboard/summary', { params });
        console.log('Dashboard summary response:', data);
        return data;
      } catch (error) {
        console.error('Dashboard summary error:', error);
        // If the request fails and we don't have an email, try with a fallback email for testing
        if (!email) {
          console.log('No email found in token, trying fallback...');
          const fallbackParams = { email: 'afiq@unikl.my' }; // Fallback for testing
          const { data } = await axiosInstance.get('/dashboard/summary', { params: fallbackParams });
          console.log('Dashboard summary fallback response:', data);
          return data;
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // Keep data in cache for 1 minute
  });
};

// Committee APIs
export const useGetCommitteeApplications = () => {
  return useQuery({
    queryKey: ['committeeApplications'],
    queryFn: async () => {
      try {
        // Get committee email for authentication
        const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
        
        console.log('Fetching committee applications with email:', committeeEmail);
        
        // Make the request with email parameter (matches our backend implementation)
        const response = await axiosInstance.get('/committee/applications', {
          params: {
            email: committeeEmail
          }
        });
        
        console.log('Committee applications response:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data
        });
        
        if (!response.data) {
          throw new Error('No data received from server');
        }

        return response.data;
      } catch (error: any) {
        // Enhanced error logging
        const errorDetails = {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
          requestConfig: error.config ? {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers ? {...error.config.headers, Authorization: 'REDACTED'} : 'No headers'
          } : 'No config'
        };
        
        console.error('Committee applications error details:', errorDetails);
        throw error;
      }
    },
    retry: 2, // Retry twice if failed
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep data in cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

export const useGetCommitteeApplication = (id: string) => {
  return useQuery({
    queryKey: ['committeeApplication', id],
    queryFn: async () => {
      const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
      const { data } = await axiosInstance.get(`/committee/applications/${id}`, {
        params: { email: committeeEmail }
      });
      return data;
    },
    enabled: !!id,
  });
};

export const useApproveCommitteeApplication = () => {
  return useMutation({
    mutationFn: async ({ id, finalAmount, comments }: { id: string; finalAmount: number; comments: string }) => {
      const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
      const { data } = await axiosInstance.post(`/committee/applications/${id}/approve`, { 
        finalAmount, 
        comments,
        email: committeeEmail 
      });
      return data;
    },
  });
};

export const useRejectCommitteeApplication = () => {
  return useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
      const { data } = await axiosInstance.post(`/committee/applications/${id}/reject`, { 
        comments,
        email: committeeEmail 
      });
      return data;
    },
  });
};

export const useGetCommitteeDashboardStats = () => {
  return useQuery({
    queryKey: ['committeeDashboardStats'],
    queryFn: async () => {
      const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
      const { data } = await axiosInstance.get('/committee/dashboard/stats', {
        params: { email: committeeEmail }
      });
      return data;
    },
  });
};

export const useGetCommitteeProfile = () => {
  return useQuery({
    queryKey: ['committeeProfile'],
    queryFn: async () => {
      const committeeEmail = localStorage.getItem('committee_email') || 'committee1@unikl.com';
      const { data } = await axiosInstance.get('/committee/profile', {
        params: { email: committeeEmail }
      });
      return data;
    },
  });
};

export const useUpdateCommitteeProfile = () => {
  return useMutation({
    mutationFn: async (payload: { username?: string }) => {
      const { data } = await axiosInstance.put('/committee/profile', payload);
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (profileData: {
      fullName: string;
      email: string;
      phoneNo: string;
      icNo: string;
      address: string;
      bankName: string;
      bankAccount: string;
      program?: string;
      semester?: number;
    }) => {
      const { data } = await axiosInstance.put('/auth/profile', profileData);
      return data;
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    }) => {
      const { data } = await axiosInstance.post('/auth/change-password', passwordData);
      return data;
    },
  });
};

export const useGetApplicationDetails = (applicationId: number) => {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/applications/${applicationId}`);
      return data;
    },
    enabled: !!applicationId,
  });
};

export const useCommitteeApplications = () => {
  return useQuery({
    queryKey: ['committee-applications'],
    queryFn: async () => {
      const response = await axiosInstance.get('/committee/applications');
      return response.data;
    }
  });
};

export const useGetApplicationsNeedingReceipt = () => {
  return useQuery({
    queryKey: ['applications-needing-receipt'],
    queryFn: async () => {
      const adminEmail = localStorage.getItem('admin_email') || 'admin@unikl.com';
      const response = await axiosInstance.get(`/admin/applications/needing-receipt?email=${adminEmail}`);
      return response.data;
    }
  });
};