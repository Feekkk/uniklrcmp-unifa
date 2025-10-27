import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../axios';
import { getUserEmailFromToken } from '@/lib/jwt-utils';

export const useChangeCommitteePassword = () => {
  return useMutation({
    mutationFn: async (data: { 
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => {
      const email = getUserEmailFromToken();
      const response = await axiosInstance.post('/auth/committee/password/change', {
        email,
        current_password: data.current_password,
        password: data.password,
        password_confirmation: data.password_confirmation
      });
      return response.data;
    }
  });
};