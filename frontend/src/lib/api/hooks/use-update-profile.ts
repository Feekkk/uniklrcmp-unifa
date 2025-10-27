import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axios';
import { getUserEmailFromToken } from '@/lib/jwt-utils';
import { useToast } from '@/hooks/use-toast';

interface UpdateProfileRequest {
  name?: string;
  phone_number?: string;
  telegram_id?: string;
  ic_number?: string;
  student_id?: string;
  email?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
}

export function useUpdateProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await axiosInstance.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
}

export const useUpdateCommitteeProfile = () => {
  return useMutation({
    mutationFn: async (data: { username: string }) => {
      const email = getUserEmailFromToken();
      const response = await axiosInstance.post('/api/committee/profile/update', {
        email,
        username: data.username
      });
      return response.data;
    }
  });
};