
import mongoose, { Schema, Types, Document } from 'mongoose';
import { PaymentMethods } from 'types/enum';
import { IFile } from 'types/file';
import { ExpenseSchema, FileSchema, commonSchemaOptions, IInvoiceBilExpense, invoiceStatusEnums, InvoiceStatusEnum, IRecievePaymentSchema, IInvoiceBilSummary, CustomFieldsSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { existsValidator } from './shared/existsValidator';
import { round2 } from 'helpers/round';

export interface IBill extends Document {
  email?: string;
  expense: IInvoiceBilExpense[];
  postingDate: Date;
  address: string;
  files?: IFile[];
  BillNumber: string;
  status?: InvoiceStatusEnum;
  invoiceDate: Date;
  dueDate: Date;
  terms?: Types.ObjectId;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  vendorId: mongoose.Types.ObjectId;
  paymentOptions: PaymentMethods;
  createdAt?: Date;
  updatedAt?: Date;
  lastPaymentDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  recievedPaymentAmount?: {
    recievedPaymentId: mongoose.Types.ObjectId;
    amount: number;
    PaymentAllocateId: mongoose.Types.ObjectId,
  }[];
  emailStatus: 'Save' | 'Save & Send' | "Failed To Send"
  id: string;
  summary?: IInvoiceBilSummary;
  customFields?: Record<string, any>;
  manager?: Types.ObjectId,
  ownerAdminId: Types.ObjectId
}


const BillSchema: Schema<IBill> = new Schema({
  address: {
    type: String,
    required: true
  },
  lastPaymentDate: { type: Date },
  emailStatus: {
    type: String,
    enum: ['Save', 'Save & Send',"Failed To Send"],
    default: "Save"
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
    required: [true, "Owner admin id is reuired"]
  },
  postingDate: { type: Date, required: true },
  expense: [ExpenseSchema],
  recievedPaymentAmount: [IRecievePaymentSchema],
  vendorId: {
    type: Schema.Types.ObjectId, ref: 'Carrier', required: true, immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,

        }),
        "Carrier"
      ),
      message: "Vendor  is not associated with this Company"
    }
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please Add Company"],
    ref: "companies", immutable: true
  },
  email: { type: String },
  files: [FileSchema],
  BillNumber: { type: String, required: true, immutable: true },
  status: {
    type: String,
    enum: invoiceStatusEnums,
    default: invoiceStatusEnums[0]
  },
  invoiceDate: {
    type: Date,
    required: true
  },
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
  collection: 'vendorbills'
});

BillSchema.index({ BillNumber: 1, companyId: 1 }, { unique: true });
BillSchema.index({ id: 1, companyId: 1 }, { unique: true });
BillSchema.index({ createdBy: 1 });
BillSchema.index({ companyId: 1 });

// Apply plugins
BillSchema.plugin(deleteGuardPlugin, { modelName: "vendorbills" });

const BillModal = mongoose.model<IBill>('vendorbills', BillSchema);
export { BillSchema };
export default BillModal;
