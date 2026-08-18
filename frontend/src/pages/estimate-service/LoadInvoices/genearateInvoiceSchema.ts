
import { IInvoice } from '@/types';
import { invoiceStatus, PaymentMethods } from '@/types/enum';
import { isValidObjectId } from '@/utils';
import { expenseItemSchema } from '@/shared/validationSchema';
import * as yup from 'yup';

export const generateInvoiceSchema = yup.object().shape({
  recievedPaymentAmount:yup.array().of(yup.mixed()).default([]).notRequired(),
  taxArray:yup.array().of(yup.mixed()).default([]).notRequired(),
  productServiceArray:yup.array().of(yup.mixed()).default([]).notRequired(),
  carrierData:yup.object().label("Carrier Data").notRequired(),
  customerdata:yup.object().label("Customer Data").notRequired(),
  expense: yup.array().of(expenseItemSchema).label("Expense").min(1,"Atleast One Expense Required").required("Atleast One Expense are Required"),
  deletedfiles:yup.array().of(yup.string()).default([]).notRequired(),
  postingDate:yup.date().label("Posting Date").required('Please select the posting date'),
  invoiceNumber: yup.string().label("Invoice Number").required('Please enter a valid invoice number'),
  invoiceDate: yup.date().label("Invoice Date").required('Please select the invoice date'),
  dueDate: yup
    .date()
    .label('Due Date')
    .required('Please select the payment due date')
    .min(
      yup.ref('invoiceDate'),
      'Due date must be the same as or after the invoice date'
    ),
  terms: yup.string().nullable().optional().label('Terms'),
  paymentOptions: yup.string().label("Payment Method").required("Please select a payment method"),
  name: yup.string().label("Customer Name").required('Customer name is required'),
  email: yup.string().label("Customer Email").email('Invalid email').optional(),
  address: yup.string().label("Customer Address").required('Customer address is required'),
  tax: yup.string().nullable().label("Tax").test("is-objectid", "Invalid Tax", (value) => {
    return !value || isValidObjectId(value);
  }),
    carrierIds:yup.array().of(yup.mixed()).label("Carrier IDs").optional().notRequired(),
  customerNotes: yup.string().label("Notes"),
  terms_conditions: yup.string().label("Terms and Conditions"),
  discountPercent: yup.number().label("Discount Percent").min(0).max(100).default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
  deposit: yup.number().label("Deposit").min(0).default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
  totalAmount: yup.number().label("Total Amount").min(0).default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
  balanceDue: yup.number().label("Balance Due").default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
  _id:yup.string().optional().label("_id").notRequired(),
  files: yup.array().label('Files').default([]).notRequired(),

       customerId:yup.string().optional().label("Customer ID").required("Customer ID is required for customer invoice"),
    subTotal:yup.number().label("Sub Total").default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
    totalDiscount: yup.number().label("Total Discount").default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
    taxAmount: yup.number().label("Tax Amount").default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
    total: yup.number().label("Total").default(0).transform((value) => {
      //  NAN check
      if (isNaN(value)) {
        return 0; // default value
      }
      return value;
    }),
 
})
export const initialInvoiseData:IInvoice = {
  _id:"",
  postingDate:undefined as any,
  taxArray:[],
  productServiceArray:[],
  type:"customer",
  customerId:"",
  deletedfiles: [],
  invoiceNumber: "",
  invoiceDate:undefined as any,
  dueDate: undefined as any,
  terms: "",
  paymentOptions:PaymentMethods.NA,
  name: "",
  email: "",
  address: "",
  tax: undefined,
  customerNotes: "",
  terms_conditions: "",
  files: [],
  expense:[],
  status:invoiceStatus.PENDING,
  discountPercent: 0,
  deposit: 0,
  totalAmount: 0,
  balanceDue: 0,
  subTotal: 0,
  totalDiscount: 0,
  taxAmount: 0,
  total: 0,
  recievedPaymentAmount:[]
}
export const invoiseItemcolumnSize = {
  service: 2,
  description: 2,
  tax: 2,
  account:1,
  qty: 1,
  rate: 1,
  discount: 1,
  amount: 1,
  delete: 1,
  }