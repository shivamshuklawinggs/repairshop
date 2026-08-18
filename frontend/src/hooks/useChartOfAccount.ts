import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IChartAccount, IParentAccountTypeEnum, masterType } from '@/types';
import { useMemo } from 'react';
export const useChartOfAccount = ({
  type,
  removeMasters,
  regularExpression,
  nor = [],
  isProductServicesPage="0",
}: {
  type:Omit<IParentAccountTypeEnum, "createdBy">[] | Omit<IParentAccountTypeEnum, "createdBy">;
  removeMasters?: masterType[];
  regularExpression?: "TAX" | "DISCOUNT";
  nor?: string[];
  isProductServicesPage?:"0"| "1"
}) => {
  const typeParam = Array.isArray(type) ? type.join(",") : type;
  const { data: chartAccounts = [], isLoading: isLoadingChartAccounts } = useQuery<IChartAccount[]>({
    queryKey: ['chartAccounts',typeParam,removeMasters],
    queryFn: async () => {
     try {
      const response = await apiService.getChartAccounts({ 
        isChartData:"0",nor:nor?.join(","),isProductServicesPage,
        type:typeParam as string,regularExpression,removeMasters:removeMasters?.join(",")});
      return response.data.data || []
     } catch (error) {
      return []
     }
    },
    
  });
    const chartAccountOptions = useMemo(
      () => chartAccounts.map((opt) => ({ value: opt._id!, label:opt.name })),
      [chartAccounts]
    )
  return { chartAccounts, isLoadingChartAccounts,chartAccountOptions };
};
