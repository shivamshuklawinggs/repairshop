import { IProductService } from 'models/product-service.model';
import { ITaxService } from 'models/tax.model';
import mongoose, { Schema } from 'mongoose';
import { IFile } from 'types/file';
import { existsValidator } from './existsValidator';
export interface IInvoiceBilSummary {
  subTotal: number;
  taxTotal: number;
  discount: number;
  finalAmount: number;
  totalRecieved:number;
  balanceDue:number
}
export interface IInvoiceExpenseSummary {
  amount: number;     // qty * rate
  taxAmount: number;  // calculated tax
  total: number;      // amount + tax
  discountAmount?:number
}
export interface IInvoiceBilExpense {
  _id?: mongoose.Types.ObjectId;
  productservice: mongoose.Types.ObjectId
  description: string;
  qty: number;
  rate: number;
  tax?: mongoose.Types.ObjectId
  readonly: boolean;
  summary?: IInvoiceExpenseSummary;
  isloadExpenses?:boolean;
  label?:string
  paidByAmount: number,
  billToAmount: number,
}
export interface IInvoiceBilExpensePopulated {
  _id: mongoose.Types.ObjectId;
  productservice: IProductService;
  description: string;
  qty: number;
  rate: number;
  tax?: ITaxService;
  readonly: boolean;
  summary?: IInvoiceExpenseSummary;
  isloadExpenses?:boolean;
  label?:string
}

export const invoiceStatusEnums = ["Pending", "Partial", "Paid", "Overdue"] as const;
export type InvoiceStatusEnum = typeof invoiceStatusEnums[number];

// Interface for documents that support status calculation
export interface IStatusCalculable extends Document {
  totalAfterDiscount?: number;
  totalRecievedAmount?: number;
  dueDate?: Date;
  status?: InvoiceStatusEnum;
  calculateStatus?(): InvoiceStatusEnum;
}

// Reusable address schema
export interface IAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Common schema options
export const commonSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  
};
export const CustomFieldsSchema = new Schema(
  {
    vin: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: 17,
      maxlength: 17,
      immutable: true
    }
  },
  { _id: false }
);
// Reusable file schema definition
export const FileSchema:Schema<IFile> = new Schema({
  fieldname: { type: String },
  originalname: { type: String },
  encoding: { type: String },
  mimetype: { type: String },
  destination: { type: String },
  filename: { type: String },
  path: { type: String },
  size: { type: Number }
}, { _id: false,timestamps: true });


export const AddressSchema = new Schema<IAddress>({
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });


export interface IEntityDetails {
  entity_type?: string;
  dba_name?: string;
  legal_name?: string;
  operating_status?: string;
  physical_address?: string;
  mailing_address?: string;
  carrier_operation?: string[];
  out_of_service_date?: string;
}

export const EntityDetailsSchema = new Schema<IEntityDetails>({
  entity_type: { type: String },
  dba_name: { type: String },
  legal_name: { type: String },
  operating_status: { type: String },
  physical_address: { type: String },
  mailing_address: { type: String },
  carrier_operation: { type: [String] },
  out_of_service_date: { type: String },
}, { _id: false });

export const ExpenseSchema: Schema<IInvoiceBilExpense> = new Schema({
  productservice: {
    type: Schema.Types.ObjectId, ref: "productservices", required: true, immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "productservices"
      ),
      message: "Product/Service in Expense is not associated with this Company"
    }
  },
  description: { type: String, immutable: true  },
  qty: { type: Number, required: true, immutable: true },
  rate: { type: Number, required: function(this: IInvoiceBilExpense) { return (this.billToAmount !== 0 || this.paidByAmount !== 0); }, immutable: true, default: 0 },
  tax: {
    type: Schema.Types.ObjectId, ref: "taxservices", immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "taxservices"
      ),
      message: "tax in exoense is not associated with this Company"
    }
  },
  isloadExpenses:{
    type:Boolean,
    default:false
  },
  label:{
    type:String,
  },
  summary: {
    amount: { type: Number, default: 0 },    // qty * rate
    taxAmount: { type: Number, default: 0 },  // calculated tax
    total: { type: Number, default: 0 }     // amount + tax
  },
  readonly: { type: Boolean, default: true, immutable: true },

});
export const IRecievePaymentSchema = new Schema({
  amount: { type: Number },
  recievedPaymentId: {
    type: Schema.Types.ObjectId, // ✅ FIXED
    ref: "accountspayments",
    required: true,
    validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "accountspayments"
      ),
      message: "Payment is not associated with this Company"
    },
  },
  PaymentAllocateId: {
    type: Schema.Types.ObjectId, // ✅ FIXED
    ref: "paymentallocations",
    required: true,
    validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "accountspayments"
      ),
      message: "Payment is not associated with this Company"
    }
  }
}, {
  _id: true,
  timestamps: true
});






