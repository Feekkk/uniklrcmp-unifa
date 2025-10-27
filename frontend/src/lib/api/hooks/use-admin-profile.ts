import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '../axios';
import { toast } from 'sonner';

interface AdminProfile {
  name: string;
  employeeId: string;
  department: string;
  level: string;
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileData {
  username: string;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export function useGetAdminProfile() {
  return useQuery({
    queryKey: ['adminProfile'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: AdminProfile; message: string }>(
        `/admin/profile`
      );
      return data.data;
    }
  });
}

export function useUpdateAdminProfile() {
  return useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      const { data } = await axiosInstance.put<{ data: AdminProfile; message: string }>(
        `/admin/profile`,
        {
          username: profileData.username
        }
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const { data } = await axiosInstance.post<{ message: string }>(
        '/admin/change-password',
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          new_password_confirmation: passwordData.new_password_confirmation
        }
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });
}