import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';

interface UseCreditLeftProps {
  amount?: number;
}

export const useCreditLeft = ({ amount: amountOverride }: UseCreditLeftProps = {}) => {
  const { watch } = useFormContext<UpdateRecievedPamentSchemaType>();
  const recievedPayments = watch('recievedPayments');
  const invoicePayments = watch('invoicePayments');
  const amount = watch('amount');

  return useMemo(() => {
    const totalRecievedCredit = recievedPayments?.reduce(
      (total, payment) => total + Number(payment?.amount || 0),
      0
    ) || 0;

    const totalSelectedInvoicesAmount = invoicePayments?.reduce(
      (total, payment) => total + Number(payment?.amount || 0),
      0
    ) || 0;

    const totalAmount = amountOverride !== undefined ? amountOverride : Number(amount || 0);
    const totalCreditLeft = totalAmount - (totalRecievedCredit + totalSelectedInvoicesAmount);

    return totalCreditLeft < 0 ? 0 : totalCreditLeft;
  }, [recievedPayments, invoicePayments, amount, amountOverride]);
};

export default useCreditLeft;
