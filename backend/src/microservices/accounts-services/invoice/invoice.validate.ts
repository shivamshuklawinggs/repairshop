import { todayDate } from 'config/constant';
import { PaymentMethods } from 'types/enum';
import * as yup from 'yup';
import { expenseItemSchema } from 'shared/validationSchema';
const transformEmptyString = (value: string) => {
  return !value ?null : value
}

 const generateInvoiceSchema = yup.object().shape({
  customFields: yup.object().shape({
       vin: yup
     .string()
     .label('VIN')
     .transform((value) => (value ? String(value).toUpperCase().trim() : value))
     .matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'VIN must be exactly 17 characters', excludeEmptyString: true })
     .optional(),
  }).optional().default({}),
   expense: yup.array().of(expenseItemSchema).label("Expense").min(1,"Atleast One Expense Required").required("Atleast One Expense are Required"),

  postingDate:yup.date().label("Posting Date").required('Please select the posting date'),
  deletedfiles:yup.array().of(yup.string()).default([]).notRequired(),
  actionType:yup.boolean().optional().default(false).notRequired(),
  invoiceNumber: yup.string().label("Invoice Number").required('Please enter a valid invoice number'),
  invoiceDate: yup.date().label("Invoice Date").default(todayDate).required('Please select the invoice date'),
  dueDate: yup.date().label("Due Date").default(todayDate).required('Please select the payment due date').min(yup.ref('invoiceDate'), 'Due date must be after invoice date'),
  terms: yup.string().nullable().optional().label('Terms').transform(transformEmptyString),
  paymentOptions: yup.string().oneOf(Object.values(PaymentMethods)).label("Payment Method").required("Please select a payment method"),
  email: yup.string().label("Customer Email").email('Invalid email').optional(),
  address: yup.string().label("Customer Address").required('Customer address is required'),
  customerNotes: yup.string().label("Notes"),
  terms_conditions: yup.string().label("Terms and Conditions"),
  discountPercent: yup.number().label("Discount Percent").min(0).max(100).default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
  files: yup.array().label('Files').default([]).notRequired(),
  customerId:yup.string().optional().label("Customer ID").required("Customer ID is required for customer invoice"),
})
type GenerateInvoiceSchema = yup.InferType<typeof generateInvoiceSchema>;


export {generateInvoiceSchema,GenerateInvoiceSchema};
