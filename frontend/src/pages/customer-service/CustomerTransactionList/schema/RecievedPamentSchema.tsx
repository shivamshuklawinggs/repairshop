import * as yup from 'yup';
// Form validation schema
export const RecievedPamentSchema = yup.object().shape({
  customer: yup.string().required('Customer is required'),
  paymentDate: yup.date().required('Payment date is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  referenceNo: yup.string(),
  invoicePayments: yup.array().of(
    yup.object().shape({
      invoiceId: yup.string().required('Invoice ID is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
    })
  ),
  depositTo: yup.string().required('Paid From is required'),
});