
import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethods } from 'types/enum';
import { IFile } from 'types/file';
import { ExpenseSchema, FileSchema, IInvoiceBilExpense, commonSchemaOptions, invoiceStatusEnums, InvoiceStatusEnum, IRecievePaymentSchema, IInvoiceBilSummary, CustomFieldsSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { existsValidator } from './shared/existsValidator';
import { round2 } from 'helpers/round';



export interface IInvoice extends Document {
  email?: string;
  postingDate: Date;
  expense: IInvoiceBilExpense[];
  address: string;
  files?: IFile[];
  invoiceNumber: string;
  status?: InvoiceStatusEnum;
  invoiceDate: Date;
  dueDate: Date;
  terms?: mongoose.Types.ObjectId;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  paymentOptions: PaymentMethods;
  customerId: mongoose.Types.ObjectId;
  createdAt?: Date;
  lastPaymentDate?: Date;
  updatedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  recievedPaymentAmount?: {
    recievedPaymentId: mongoose.Types.ObjectId;
    PaymentAllocateId: mongoose.Types.ObjectId,
    amount:number
  }[];
   id:string;
   emailStatus: 'Save' | 'Save & Send' | 'Failed To Send'
   summary?: IInvoiceBilSummary;
   reminderSentDate?:Date
   customFields?: {
    vin:string
   }
   manager?: mongoose.Types.ObjectId,
   ownerAdminId: mongoose.Types.ObjectId
   
}


const InvoiceSchema: Schema<IInvoice> = new Schema({
  address: {
    type: String,
    required: true
  },
  lastPaymentDate: { type: Date },
  reminderSentDate:Date,
  emailStatus:{
  type:String,
  enum:['Save', 'Save & Send','Failed To Send'],
  default:'Save'
  },
  
  expense: [ExpenseSchema],
  recievedPaymentAmount: [IRecievePaymentSchema],
  companyId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please Add Company"],
    ref: "companies", immutable: true
  },
  customerId: {
    type: Schema.Types.ObjectId, ref: 'Customer',required:true, immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
       "Customer"
      ),
      message: "Customer  is not associated with this Company"
    }
  },
  email: { type: String },
  files: [FileSchema],
  invoiceNumber: { type: String, required: true, immutable: true },
  status: {
    type: String,
    enum: invoiceStatusEnums,
    default: invoiceStatusEnums[0]
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  postingDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  terms: {
    type: Schema.Types.ObjectId, ref: 'PaymentTerms', validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "PaymentTerms"
      ),
      message: "Payment Terms is not associated with this Company"
    }
  },
  customerNotes: { type: String },
  terms_conditions: { type: String },
   discountPercent: {
     type: Number,
     default: 0,
   },
  deposit: { type: Number, default: 0 },
  paymentOptions: { type: String, required: true, enum: Object.values(PaymentMethods) },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  summary: {
    subTotal: { type: Number, default: 0, set: round2 },
    taxTotal: { type: Number, default: 0, set: round2 },
    discount: { type: Number, default: 0, set: round2 },
    finalAmount: { type: Number, default: 0, set: round2 },
    totalRecieved: { type: Number, default: 0, set: round2 },
    balanceDue: { type: Number, default: 0, set: round2, min: [0, 'Balance due cannot be negative'] },
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
  },
  ownerAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
    required:[true,"Owner admin id is reuired"]
  },
  customFields: {
    type: CustomFieldsSchema,
    default: {}
  },
  id: {
    type: String,
    required: [true, 'Please Add Id'],
    immutable: true
  },
}, {
  ...commonSchemaOptions,
  collection:"accountsinvoices"
});
// Invoice Schema
InvoiceSchema.index({ vin: 1, companyId: 1 });
InvoiceSchema.index({ invoiceNumber: 1, companyId: 1 }, { unique: true });
InvoiceSchema.index({ id: 1, companyId: 1 }, { unique: true });
InvoiceSchema.index({ createdBy: 1 });
InvoiceSchema.index({ companyId: 1 });
// Apply plugins
InvoiceSchema.plugin(deleteGuardPlugin, { modelName: "accountsinvoices" });
const InvoiceModal = mongoose.model<IInvoice>('accountsinvoices', InvoiceSchema);
export { InvoiceSchema };
export default InvoiceModal;
