import * as yup from 'yup';
// Form validation schema
export const RecievedPamentSchema = yup.object().shape({
  customerId: yup.string().required("Customer is required").label("Customer"),
  postingDate:yup.date().label("Posting Date").required('Please select the posting date'),
  paymentDate: yup.date().required('Payment date is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  referenceNo: yup.string().optional().label("Reference No"),
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
  depositTo: yup.string().required('Paid From is required'),
  invoicePayments: yup.array().of(
    yup.object().shape({
      invoiceId: yup.string().required('Invoice ID is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
    })
  ),

}).test("amount", "Invalid Amount", (value,{createError}) => {
//     total amount of invoicePayments array amount should be equal to amount
const totalAmount = value.invoicePayments?.reduce((acc, invoicePayment) => acc + invoicePayment.amount, 0) || 0
if (totalAmount > value.amount) {
  let additionalAmount = totalAmount - value.amount;
  return createError({
    path:"amount",
    type:"amount",
    message: `Please Enter ${additionalAmount} More`
  });
}
  return true;
})

// Form validation schema
export const UpdateRecievedPamentSchema = yup.object().shape({
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
  paymentDate: yup.date().required('Payment date is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  referenceNo: yup.string().optional().label("Reference No"),
  depositTo: yup.string().required('Paid From is required'),
  invoicePayments: yup.array().of(
    yup.object().shape({
      invoiceId: yup.string().required('Invoice ID is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
    })
  ).optional().default([]),
  deletedPayments: yup.array().of(
    yup.object().shape({
      invoiceId: yup.string().required('Invoice ID is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
      PaymentAllocateId: yup.string().required('Payment allocate ID is required'),
      recievedPaymentId: yup.string().required('Received payment ID is required'),
    })
  ).optional().default([]),
  recievedPayments: yup.array().of(
    yup.object().shape({
      invoiceId: yup.string().required('Invoice ID is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
      _id: yup.string().required('ID is required'),
      PaymentAllocateId: yup.string().required('Payment allocate ID is required'),
      recievedPaymentId: yup.string().required('Received payment ID is required'),
    })
  ).optional().default([]),
}).test("amount", "Invalid Amount", (value, { createError }) => {
  //     total amount of invoicePayments array amount should be equal to amount
  const totalAmount = value.invoicePayments?.reduce((acc, invoicePayment) => acc + invoicePayment.amount, 0) || 0;
  const totalRecievedAmount = value.recievedPayments?.reduce((acc, invoicePayment) => acc + invoicePayment.amount, 0) || 0;
  const totalAmountWithRecievedAmount = totalAmount + totalRecievedAmount;
  if (totalAmountWithRecievedAmount > value.amount) {
    let additionalAmount = totalAmountWithRecievedAmount - value.amount;
    //  throw error in amount filed
    return createError({
      path: "amount",
      type: "amount",
      message: `Please Enter ${additionalAmount} More`
    });
  }
  return true;
})

export type UpdateRecievedPamentSchemaType = yup.InferType<typeof UpdateRecievedPamentSchema>;