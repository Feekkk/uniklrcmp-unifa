import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../axios';
import { toast } from '@/hooks/use-toast';
import { getStoredToken } from '@/lib/jwt-utils';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'committee';
  created_at: string;
  updated_at: string;
}

interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  admin_email?: string;
}

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = getStoredToken();
      const adminEmail = localStorage.getItem('admin_email');
      
      if (!token && !adminEmail) {
        throw new Error('No authentication available');
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get('/admin/users', {
        headers,
        params: { email: adminEmail }
      });
      return response.data.data.users;
    },
  });

  // Update user
  const updateUser = useMutation({
    mutationFn: async ({ id, userType, ...data }: { id: string; userType: 'student' | 'committee' } & UpdateUserPayload) => {
      const token = getStoredToken();
      const adminEmail = localStorage.getItem('admin_email');
      
      if (!token && !adminEmail) {
        throw new Error('No authentication available');
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Strip out admin_email from the data if it exists
      const { admin_email, ...cleanData } = data;

      // Use the correct endpoint based on user type
      const endpoint = userType === 'committee' ? `/admin/committees/${id}` : `/admin/students/${id}`;

      // Make request with admin email in query params
      const response = await axios.put(endpoint, cleanData, {
        headers,
        params: { email: adminEmail }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User details updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async ({ id, userType }: { id: string; userType: 'student' | 'committee' }) => {
      const token = getStoredToken();
      const adminEmail = localStorage.getItem('admin_email');
      
      if (!token && !adminEmail) {
        throw new Error('No authentication available');
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use the correct endpoint based on user type
      const endpoint = userType === 'committee' ? `/admin/committees/${id}` : `/admin/students/${id}`;

      const response = await axios.delete(endpoint, {
        headers,
        params: { email: adminEmail }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    updateUser: updateUser.mutate,
    deleteUser: deleteUser.mutate,
  };
};