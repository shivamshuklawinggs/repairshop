import * as yup from 'yup';

// ============================================================================
// REUSABLE SCHEMA COMPONENTS
// ============================================================================

// Base invoice payment schema (minimal fields)
const invoicePaymentSchema = yup.object().shape({
  invoiceId: yup.string().required('Invoice ID is required'),
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
});

// Deleted payment schema (includes allocation tracking)
const deletedPaymentSchema = yup.object().shape({
  invoiceId: yup.string().required('Invoice ID is required'),
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
  PaymentAllocateId: yup.string().required('Payment allocate ID is required'),
  recievedPaymentId: yup.string().required('Received payment ID is required'),
});

// Received payment schema (includes _id and allocation tracking)
const receivedPaymentSchema = yup.object().shape({
  invoiceId: yup.string().required('Invoice ID is required'),
  amount: yup.number().min(0, 'Amount is Required').required('Amount is required'),
  OriginalAmount:yup.number().optional(),
  _id: yup.string().required('ID is required'),
  PaymentAllocateId: yup.string().required('Payment allocate ID is required'),
  recievedPaymentId: yup.string().required('Received payment ID is required'),
  totalAmountWithTax: yup.number().optional(),
  invoiceNumber: yup.string().optional(),
});

// Base payment fields (common to both create and update)
const basePaymentFields = {
  paymentDate: yup.date().required('Payment date is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  referenceNo: yup.string().optional().label("Reference No"),
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
  depositTo: yup.string().required('Paid From is required'),
};

// Filter fields (for searching/filtering invoices)
const filterFields = {
  searchInvoice: yup.string().optional().label("Search Invoice"),
  fromDate: yup.date().nullable().optional().label("From Date"),
  toDate: yup.date().nullable().optional().label("To Date"),
  overdueOnly: yup.string().nullable().optional().label("Overdue Only"),
};

// Customer field
const customerField = {
  customer: yup.string().required("Customer is required").label("Customer"),
};

// ============================================================================
// VALIDATION TESTS
// ============================================================================

// Amount validation test for create payment
const createPaymentAmountTest = (value: any, { createError }: any) => {
  const totalAmount = value.invoicePayments?.reduce(
    (acc: number, invoicePayment: any) => acc + invoicePayment.amount,
    0
  ) || 0;

  if (totalAmount > value.amount) {
    const overAmount = totalAmount - value.amount;
    return createError({
      path: "amount",
      type: "amount",
      message: `Amount applied exceeds payment by ${overAmount.toFixed(2)}`
    });
  }
  return true;
};

// Amount validation test for update payment
const updatePaymentAmountTest = (value: any, { createError }: any) => {
  const totalAmount = value.invoicePayments?.reduce(
    (acc: number, invoicePayment: any) => acc + invoicePayment.amount,
    0
  ) || 0;

  const totalRecievedAmount = value.recievedPayments?.reduce(
    (acc: number, invoicePayment: any) => acc + invoicePayment.amount,
    0
  ) || 0;

  const totalAmountWithRecievedAmount = totalAmount + totalRecievedAmount;

  if (totalAmountWithRecievedAmount > value.amount) {
    const overAmount = totalAmountWithRecievedAmount - value.amount;
    return createError({
      path: "amount",
      type: "amount",
      message: `Amount applied exceeds payment by ${overAmount.toFixed(2)}`
    });
  }
  return true;
};

// ============================================================================
// MAIN SCHEMAS
// ============================================================================

// Create Payment Schema
export const RecievedPamentSchema = yup.object().shape({
  postingDate: yup.date().label("Posting Date").required('Please select the posting date'),
  ...basePaymentFields,
  ...filterFields,
  ...customerField,
  invoicePayments: yup.array().of(invoicePaymentSchema),
}).test("amount", "Invalid Amount", createPaymentAmountTest);

// Update Payment Schema
export const UpdateRecievedPamentSchema = yup.object().shape({
  postingDate: yup.date().label("Posting Date").required('Please select the posting date'),
  ...basePaymentFields,
  ...filterFields,
  ...customerField,
  invoicePayments: yup.array().of(invoicePaymentSchema).optional().default([]),
  deletedPayments: yup.array().of(deletedPaymentSchema).optional().default([]),
  recievedPayments: yup.array().of(receivedPaymentSchema).optional().default([]),
}).test("amount", "Invalid Amount", updatePaymentAmountTest);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpdateRecievedPamentSchemaType = yup.InferType<typeof UpdateRecievedPamentSchema>;
export type RecievedPamentSchemaType = yup.InferType<typeof RecievedPamentSchema>;