import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';

export const useAmountApplied = () => {
  const { watch } = useFormContext<UpdateRecievedPamentSchemaType>();
  const recievedPayments = watch('recievedPayments');

  return useMemo(() => {
    if (!recievedPayments) return 0;
    return recievedPayments.reduce(
      (total, payment) => total + Number(payment?.amount || 0),
      0
    );
  }, [recievedPayments]);
};
