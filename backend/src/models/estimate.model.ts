
import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentMethods } from 'types/enum';
import { IFile } from 'types/file';
import { ExpenseSchema, FileSchema, IInvoiceBilExpense, commonSchemaOptions, invoiceStatusEnums, InvoiceStatusEnum, IInvoiceBilSummary, IRecievePaymentSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { existsValidator } from './shared/existsValidator';




export interface IIestimate extends Document {
  accepted?: boolean,
  email?: string;
  postingDate: Date;
  emailStatus:'Save' | 'Save & Send' | 'Failed To Send'
  summary?: IInvoiceBilSummary;
  expense: IInvoiceBilExpense[]
  address: string;
  name: string;
  tax?: Types.ObjectId;
  files?: IFile[];
  invoiceNumber: string;
  status?: InvoiceStatusEnum;
  invoiceDate: Date;
  dueDate: Date;
  terms: mongoose.Types.ObjectId;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  carrierId?: mongoose.Types.ObjectId;
  paymentOptions: PaymentMethods;
  customerId: mongoose.Types.ObjectId;
  type: 'customer' | 'carrier' | 'other';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  manager?: mongoose.Types.ObjectId,
  ownerAdminId: mongoose.Types.ObjectId
  recievedPaymentAmount?: {
    paymentDate: Date;
    recievedPaymentId: mongoose.Types.ObjectId,
    PaymentAllocateId: mongoose.Types.ObjectId,
    amount:number
    
  }[]
}


const EstimateSchema: Schema<IIestimate> = new Schema({
  address: {
    type: String,
    required: true
  },
  expense: [ExpenseSchema],
  emailStatus: {
    type: String,
    enum: ['Save', 'Save & Send', "Failed To Send"],
    default: "Save"
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please Add Company"],
    ref: "companies",
    immutable: true
  },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', immutable: true,validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,

          
        }),
       "Customer"
      ),
      message: "Customer is not associated with this Company"
    }
  },
  email: { type: String },
  files: [FileSchema],
  invoiceNumber: { type: String, required: true,  immutable: true },
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
  recievedPaymentAmount: [IRecievePaymentSchema],
  deposit: { type: Number, default: 0 },
  paymentOptions: { type: String, required: true, enum: Object.values(PaymentMethods) },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  summary: {
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    totalRecieved: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0, min: [0, 'Balance due cannot be negative']  },
  }
}, {
  ...commonSchemaOptions
});
EstimateSchema.index({ invoiceNumber: 1, companyId: 1 }, { unique: true })
EstimateSchema.index({ createdBy: 1 })
EstimateSchema.index({ companyId: 1 })
// Apply delete guard plugin
EstimateSchema.plugin(deleteGuardPlugin, { modelName: "estimates" });
const EstimateModal = mongoose.model<IIestimate>('estimates', EstimateSchema);
export { EstimateSchema };
export default EstimateModal;
