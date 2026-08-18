import { useEffect } from 'react';
import moment, { Moment } from 'moment';
import apiService from '@/service/apiService';
import { IPaymentTerm } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import { addDays } from './dateUtils';

interface FormValues {
  terms: string;
  invoiceDate: Moment;
  dueDate: Moment;
  postingDate: Moment;
  _id?:string
}

/**
 * ✅ useDueDateCalculator Hook
 * Automatically calculates the due date based on invoice date and payment terms.
 */
export const useDueDateCalculator = (
  setValue: UseFormReturn<FormValues>['setValue'],
  watch: UseFormReturn<FormValues>['watch']
) => {
  const terms = watch('terms');
  const invoiceDate = watch('invoiceDate');
  const dueDate = watch("dueDate");
  const id = watch("_id");
  useEffect(() => {
    const updateDueDate = async () => {
      let noOfDays = 0;
      try {
        
        if (terms) {
          const response = await apiService.getPaymentTermById(terms);
          const paymentTerm: IPaymentTerm = response.data;
          noOfDays = paymentTerm.days || 0;
        }
      } catch (err) {
        noOfDays = 0;
      } finally {
        if (invoiceDate && !id) {
          // Add days to invoice date using moment
          const newDueDate =addDays(invoiceDate,noOfDays)
          // Set the new due date as a Moment instance
          setValue('dueDate', moment(newDueDate));
        }
      }
    };
    const updatePostingDate = async () => {
      try {
        if (moment(invoiceDate).isValid() && !id) {
          setValue("postingDate", moment(invoiceDate));
        }
      } catch (err) {
        console.log("posting date update error")
      }
    };
    updatePostingDate()
    updateDueDate();
  }, [terms, invoiceDate,id]);
};

export default useDueDateCalculator;
