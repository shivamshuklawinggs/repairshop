import { todayDate } from 'config/constant';
import  { isValidObjectId } from 'mongoose';
import { expenseItemSchema } from 'shared/validationSchema';
import * as yup from 'yup';
const objectIdCheck = (value: string) => {
  return !value ?true : isValidObjectId(value)
}

 const generateBillSchema = yup.object().shape({
  carrierData:yup.object().label("Carrier Data").notRequired(),
  customerdata:yup.object().label("Customer Data").notRequired(),
  expense: yup.array().of(expenseItemSchema).label("Expense").min(1,"Atleast One Expense Required").required("Atleast One Expense are Required"),
  postingDate:yup.date().label("Posting Date").required('Please select the posting date'),
  deletedfiles:yup.array().of(yup.string()).default([]).notRequired(),
  actionType:yup.boolean().optional().default(false).notRequired(),
  BillNumber: yup.string().label("Bill Number").required('Please enter a valid bill number'),
  invoiceDate: yup.date().label("Bill Date").default(todayDate).required('Please select the invoice date'),
  dueDate: yup.date().label("Due Date").default(todayDate).required('Please select the payment due date').min(yup.ref('invoiceDate'), 'Due date must be after invoice date'),
  terms: yup.string().nullable().optional().label('Terms'),
  paymentOptions: yup.string().label("Payment Method").required("Please select a payment method"),
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
  vendorId:yup.string().required("Vendor ID is required").test("is-objectid", "Invalid ObjectId", objectIdCheck as any),
})
type GenerateBillSchema = yup.InferType<typeof generateBillSchema>;

export {generateBillSchema,GenerateBillSchema};
