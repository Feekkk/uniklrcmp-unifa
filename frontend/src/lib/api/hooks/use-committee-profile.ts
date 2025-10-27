import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axios';
import { getUserEmailFromToken } from '@/lib/jwt-utils';

export const useGetCommitteeProfile = () => {
  const email = getUserEmailFromToken();
  
  return useQuery({
    queryKey: ['committee-profile', email],
    queryFn: async () => {
      const response = await axiosInstance.get(`/auth/committee/profile`, {
        params: { email }
      });
      return response.data;
    },
    enabled: !!email
  });
};