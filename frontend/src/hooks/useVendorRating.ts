import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';

interface UseVendorRatingProps {
  enabled?: boolean;
  carrierId: string;
}

export const useVendorRating = ({enabled = true,carrierId }: UseVendorRatingProps) => {
  return useQuery<{ success: boolean; data:{
    overallScore:number
  } }>({
    queryKey: ['vendorRating',carrierId],
    queryFn: async () => {
      const response = await apiService.getVendorRating(carrierId);
      return response;
    },
    enabled: enabled  && !!carrierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: true,
  });
};