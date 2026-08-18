import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import apiService from '@/service/apiService';
import {  ICustomer, IInvoice } from '@/types';
import { PaymentMethods } from '@/types/enum';
import { useQuery } from '@tanstack/react-query';

interface UseCustomerDataProps {
  customerId: string | null | undefined;
  form: UseFormReturn<IInvoice>;
  _id:string
}

export const useCustomerData = ({ customerId, form,_id }: UseCustomerDataProps) => {
  const { data: customer, isError } = useQuery<ICustomer | null>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      try {
        const response = await apiService.getCustomer(customerId);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!customerId,
  });

  useEffect(() => {
    if (customer) {
      if(!form.watch("email"))  form.setValue("email", customer.email);
      if(!form.watch("address")) form.setValue("address",customer.address || customer.billingAddress?.address || "");
      form.setValue("name", customer.company || "");
      if(!_id){
        form.setValue("paymentOptions",customer.paymentMethod)
        form.setValue("terms",customer.paymentTerms)
      }
    } else if (isError) {
      form.setValue("name", "");
      form.setValue("paymentOptions",PaymentMethods.NA)
      form.setValue("terms","")
    }
  }, [customerId, _id, customer, isError, form]);

  return {
    // You might want to return something here, but it's not specified in the instructions
  };
};