import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import apiService from '@/service/apiService';
import { ICarrier, IVendorBill } from '@/types';
import { PaymentMethods } from '@/types/enum';
import { useQuery } from '@tanstack/react-query';

interface UseVendorDataProps {
  vendorId: string | null | undefined;
  form: UseFormReturn<IVendorBill>;
  _id:string
}

export const useVendorData = ({ vendorId, form,_id }: UseVendorDataProps) => {
  const { data: vendorData, isError } = useQuery<ICarrier | null>({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      try {
        const response = await apiService.getCarrier(vendorId);
        return response.data;
      } catch (error) {
        try {
          const response = await apiService.getVendor(vendorId);
          return response.data;
        } catch (fallbackError) {
          return null;
        }
      }
    },
    enabled: !!vendorId,
  });

  useEffect(() => {
    if (vendorData) {
       if(!form.watch("email"))  form.setValue("email", vendorData.email);
      if(!form.watch("address")) form.setValue("address",vendorData.address || vendorData.billingAddress?.address || "");
      
      if(!_id){
        form.setValue("paymentOptions",vendorData.paymentMethod || PaymentMethods.NA)
        form.setValue("terms",vendorData.paymentTerms || "")
      }
    } else if (isError) {
      form.setValue("paymentOptions",PaymentMethods.NA)
      form.setValue("terms","")
    }
  }, [vendorId, _id, vendorData, isError]);

  return {
    // You might want to return something here, but it's not specified in the instructions
  };
};