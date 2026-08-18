import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { Role } from '@/types';
import { useAppSelector } from '@/redux/store';

export const useCompanies = () => {
  const { user, token } = useAppSelector((state) => state.user);

  return useQuery({
    queryKey: ['companies',user],
    queryFn: async () => {
      const response = await apiService.getCompanies({ page: 1, limit: 100 });
      return response.data;
    },
    enabled: Boolean(token) && Boolean(user) && user?.role !== Role.SUPERADMIN,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
