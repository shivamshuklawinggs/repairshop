import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IParentAccountType, IAccountDetailType } from '@/types';

/**
 * Hook to fetch chart account types (parent account types)
 */
export const useAccountTypes = () => {
  const { data: accountTypes = [], isLoading: isLoadingAccountTypes } = useQuery<IParentAccountType[]>({
    queryKey: ['chartAccountTypes'],
    queryFn: async () => {
      const response = await apiService.getChartAccountTypes();
      return response.data 
    },
  });

  return { accountTypes, isLoadingAccountTypes };
};

/**
 * Hook to fetch detail types (sub-types) for a specific account type
 * @param accountType - The parent account type ID
 */
export const useDetailTypes = (accountType?: string) => {
  const { data: detailTypes = [], isLoading: isLoadingDetailTypes } = useQuery<IAccountDetailType[]>({
    queryKey: ['chartAccountSubTypes', accountType],
    queryFn: async () => {
      const response = await apiService.getChartAccountSubTypes(accountType as string);
      return response.data;
    },
    enabled: !!accountType, // Only run this query if an accountType is provided
  });

  return { detailTypes, isLoadingDetailTypes };
};

/**
 * Combined hook to fetch both account types and detail types
 * @param accountType - Optional parent account type ID for fetching detail types
 */
export const useChartAccountTypes = (accountType?: string) => {
  const { accountTypes, isLoadingAccountTypes } = useAccountTypes();
  const { detailTypes, isLoadingDetailTypes } = useDetailTypes(accountType);
   
  return {
    accountTypes,
    isLoadingAccountTypes,
    detailTypes,
    isLoadingDetailTypes,
  };
};
