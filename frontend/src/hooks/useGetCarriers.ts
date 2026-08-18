import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';

interface UseGetCarriersParams {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export const useGetCarriers = ({ page = 1, limit = 100, search = '', enabled = true }: UseGetCarriersParams = {}) => {
   const { data: carriersData, isLoading, error }= useQuery({
    queryKey: ['carriers', page, limit, search],
    queryFn: async () => {
      const response = await apiService.getCarriers({
        page,
        limit,
        search: search || undefined,
      });
      return response;
    },
    enabled,
  });

  return { carriersData, isLoading, error };
};

export default useGetCarriers;
