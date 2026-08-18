import React from 'react';
import { TextField } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { ICustomerInvoicesPaymentDetails } from '@/types';

interface InvoiceAmountProps {
  invoice: ICustomerInvoicesPaymentDetails;
  index: number;
  isLoading: boolean;
  formContextType?: 'IPaymentRecived' | 'UpdateRecievedPamentSchemaType' | 'none';
}

const InvoiceAmount: React.FC<InvoiceAmountProps> = ({
  invoice,
  index,
  isLoading,
  formContextType = 'IPaymentRecived'
}) => {
  const { setValue, watch, getValues } = useFormContext<any>();
  const invoicePayments = watch('invoicePayments') || [];
  const currentPayment = invoicePayments.find((p: any) => p.invoiceId === invoice._id);
  const localAmount = currentPayment?.amount?.toString() || '';

  const handleInvoiceAmountChange = (value: any) => {
    const amount = Number(value) || 0;
    const totalAmount = getValues('amount') || 0;

    const allPayments = getValues('invoicePayments') || [];
    let updatedPayments = [...allPayments];

    const existingIndex = updatedPayments.findIndex(
      (p) => p.invoiceId === invoice._id
    );

    if (amount > 0) {
      const newPayment = {
        invoiceId: invoice._id,
        amount,
        totalAmountWithTax: invoice.totalAmountWithTax
      };

      if (existingIndex !== -1) {
        updatedPayments[existingIndex] = newPayment;
      } else {
        updatedPayments.push(newPayment);
      }
    } else {
      if (existingIndex !== -1) {
        updatedPayments.splice(existingIndex, 1);
      }
    }

    // Calculate new total and adjust if exceeds payment amount
    const newTotal = updatedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    if (newTotal > totalAmount) {
      const excess = parseFloat((newTotal - totalAmount).toFixed(2));
      let remainingExcess = excess;

      // Reduce from other invoices (from last to first, excluding current)
      for (let i = updatedPayments.length - 1; i >= 0 && remainingExcess > 0; i--) {
        const payment = updatedPayments[i];
        if (payment.invoiceId === invoice._id) continue;

        const reduceAmount = parseFloat(Math.min(payment.amount, remainingExcess).toFixed(2));
        if (reduceAmount > 0) {
          payment.amount = parseFloat((payment.amount - reduceAmount).toFixed(2));
          remainingExcess = parseFloat((remainingExcess - reduceAmount).toFixed(2));
          if (payment.amount === 0) {
            updatedPayments.splice(i, 1);
          }
        }
      }
    }

    setValue('invoicePayments', updatedPayments, { shouldValidate: true });
  };

  return (
    <TextField size='small'
      type="number"
      fullWidth
      placeholder={`Max: ${invoice.balanceDue.toFixed(2)}`}
      helperText={localAmount && parseFloat(localAmount) > invoice.balanceDue ? `Amount cannot exceed ${invoice.balanceDue.toFixed(2)}` : ''}
      error={!!(localAmount && parseFloat(localAmount) > invoice.balanceDue)}
      disabled={isLoading}
      value={localAmount}
      onChange={(e) => handleInvoiceAmountChange(e.target.value)}
      inputProps={{
        inputMode: 'decimal',
      }}
      sx={{
        '& .MuiInputBase-input': {
          padding: '5.5px 10px', // top-bottom left-right
          fontSize: '14px',
        },
      }}
    />
  );
};

export default InvoiceAmount;
