import {IVendorBill } from '@/types';
import { invoiceStatus, PaymentMethods } from '@/types/enum';
import { isValidObjectId } from '@/utils';
import * as yup from 'yup';
import { expenseItemSchema } from '@/shared/validationSchema';
export const generateInvoiceSchema = yup.object().shape({
   recievedPaymentAmount:yup.array().of(yup.mixed()).default([]).notRequired(),
  taxArray:yup.array().of(yup.mixed()).default([]).notRequired(),
  productServiceArray:yup.array().of(yup.mixed()).default([]).notRequired(),
  customerdata:yup.object().label("Vendor Data").notRequired(),
  expense: yup.array().of(expenseItemSchema).label("Expense").min(1,"Atleast One Expense Required").required("Atleast One Expense are Required"),
  postingDate:yup.date().label("Posting Date").required('Please select the posting date'),
  deletedfiles:yup.array().of(yup.string()).default([]).notRequired(),
  BillNumber: yup.string().label("Bill Number").required('Please enter a valid bill number'),
  invoiceDate: yup.date().label("Bill Date").required('Please select the bill date'),
  dueDate: yup.date().label("Due Date").required('Please select the payment due date').min(yup.ref('invoiceDate'), 'Due date must be after invoice date'),
  terms: yup.string().nullable().optional().label('Terms'),
  paymentOptions: yup.string().label("Payment Method").required("Please select a payment method"),
  email: yup.string().label("Customer Email").email('Invalid email').optional(),
  address: yup.string().label("Customer Address").required('Customer address is required'),
  tax: yup.string().nullable().label("Tax").test("is-objectid", "Invalid Tax", (value) => {
    return !value || isValidObjectId(value);
  }),
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
    vendorId:yup.string().label("Vendor").required('Vendor is required'),
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
export const initialInvoiseData:IVendorBill = {
  _id:"",
  taxArray:[],
  postingDate:undefined as any,
  productServiceArray:[],
  type:"other",
  vendorId:"",
  deletedfiles: [],
  BillNumber: "",
  invoiceDate:undefined as any,
  dueDate: undefined as any,
  terms: "",
  paymentOptions:PaymentMethods.NA,
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