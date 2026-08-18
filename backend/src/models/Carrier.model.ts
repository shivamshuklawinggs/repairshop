import mongoose, { Schema, Document, Types } from 'mongoose';
import { IFile } from 'types/file';
import { PaymentMethods, CustomerStatus } from 'types/enum';
import { FileSchema, AddressSchema, IAddress, commonSchemaOptions, CustomFieldsSchema, EntityDetailsSchema, IEntityDetails, IInvoiceBilSummary } from './shared/schemas';
import { generateUniqueId } from './universalid.model';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
export type Title = 'mr' | 'mrs' | 'ms' | 'dr' | 'other';

export interface ICarrier extends Document {
  company: string;
  contactPerson: string;
  phone?: string;
  alternatphone?: string;
  address: string;
  rate?: Number;
  zipCode?: string;
  state?: string;
  mcNumber: string;
  extentionNo?: string;
  usdot?: string;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  powerunit?: string[];
  trailer?: string[];
  documents?: IFile[];
  entityDetails?: IEntityDetails;
  insurerCompany?: string;
  agentName?: string;
  agentAddress?: string;
  agentEmail?: string;
  agentExtentionNo?: string;
  agentPhoneNumber?: string;
  isSubCustomer?: boolean;
  parentCustomer?: mongoose.Types.ObjectId;
  isSubVendor?: boolean;
  parentVendor?: mongoose.Types.ObjectId;
  mobileNo?: string;
  fax?: string;
  other?: string;
  website?: string;
  nameToPrintOnCheck?: string;
  displayCustomerName?: string;
  billingAddress?:IAddress
  notes?: string;
  paymentMethod?: PaymentMethods;
  paymentTerms?: mongoose.Types.ObjectId;
  shippingAddress?:IAddress
  email?: string;
  companyId: mongoose.Types.ObjectId;
  status?: CustomerStatus;
  extension?: string;
  id: string;
  autoScore: number;   // 0–100
  totalDrivers?: number;   // 0–100
  stars: number;       // 0–5  (autoScore / 20)
  customFields?: Record<string, any>;
  manager?:Types.ObjectId,
  ownerAdminId:Types.ObjectId;
  deleteFiles?: string[];
  withoutUsdot?: boolean;
  sameAsBillingAddress?: boolean;
  summary?:IInvoiceBilSummary
}

const CarrierSchema: Schema<ICarrier> = new Schema({
  summary: {
    subTotal: { type: Number, default: 0, },
    taxTotal: { type: Number, default: 0, },
    discount: { type: Number, default: 0, },
    finalAmount: { type: Number, default: 0, },
    totalRecieved: { type: Number, default: 0, },
    balanceDue: { type: Number, default: 0, },
  },
  totalDrivers: { type: Number, default: 0,  },
  autoScore: { type: Number, default: 50, min: 0, max: 100 },
  stars:     { type: Number, default: 2.5, min: 0, max: 5 },
  company: { type: String, required: false },
  email: { type: String,required:[true,"Email Is Required"]},
  usdot: { type: String },
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
  phone: { type: String, required: false },
  mobileNo: { type: String, required: false },
  fax: { type: String },
  other: { type: String },
  website: { type: String },
  nameToPrintOnCheck: { type: String },
  displayCustomerName: { type: String },
  parentCustomer: { type: Schema.Types.ObjectId, ref: "Carrier" },
  isSubVendor: { type: Boolean, required: false },
  parentVendor: { type: Schema.Types.ObjectId, ref: "Carrier" },
  billingAddress:AddressSchema,
  shippingAddress:AddressSchema,
  notes: String,
  paymentMethod: { type: String, enum: Object.values(PaymentMethods), required: false },
  paymentTerms: { type: Schema.Types.ObjectId, ref: 'PaymentTerms',  required: false },
  isSubCustomer: { type: Boolean, required: false },
  status: { type: String, enum: Object.values(CustomerStatus), default: CustomerStatus.ACTIVE },
  contactPerson: { type: String },
  alternatphone: { type: String },
  agentPhoneNumber: { type: String },
  extentionNo: { type: String },
  address: { type: String },
  mcNumber: { type: String,  },
  
  extension: {
    type: String
  },
  entityDetails: EntityDetailsSchema,
  zipCode: { type: String, required: false },
  state: { type: String, required: false },
  rate: { type: Number, default: 0 },
 companyId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please Add Company"],
    ref: "companies",immutable:true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable:true,
    required:[true,'Please Add Created By']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,'Please Add Updated By']
  },
  powerunit: {
    type: [String],
    validate: {
      validator: function (value: string[]) {
        return new Set(value).size === value.length; // No duplicates within array
      },
      message: "Duplicate power units are not allowed within the same carrier"
    },
    // required:[true,"Please Add Powerunit"]
  },
  trailer: {
    type: [String],
    validate: {
      validator: function (value: string[]) {
        return new Set(value).size === value.length; // No duplicates within array
      },
      message: "Duplicate trailers are not allowed within the same carrier"
    },
    // required:[true,"Please Add Trailer"]
  },
  documents: [FileSchema],
  insurerCompany: { type: String, default: "" },
  agentName: { type: String, default: "" },
  agentAddress: { type: String, default: "" },
  agentEmail: { type: String, default: "" },
  agentExtentionNo: { type: String },
  id: { type: String, trim: true, required: true },
   customFields: {
      type: CustomFieldsSchema,
      default: {}
    },
  withoutUsdot: { type: Boolean },
  sameAsBillingAddress: { type: Boolean }
}, {
  ...commonSchemaOptions,
  collection: "carriers"
});

// validate if id does not exist then create 
CarrierSchema.pre("validate", async function(next) {
  if (!this.id) {
    const session =this.$session() ||undefined
    this.id = await generateUniqueId({prefix:"VENDOR-",session,companyId:this.companyId})
  }
  next();
});
CarrierSchema.pre<ICarrier>('save', async function (next) {

  try {
    if (!this.email) {
      this.email = undefined;
    }
    if (!this.usdot) {
      this.usdot = undefined;
    }
    if (this.withoutUsdot) {
      this.entityDetails = undefined;
      this.usdot = undefined;
    }
    next();
  } catch (err) {
    console.warn(err);
  }
});
CarrierSchema.pre<ICarrier>('validate', async function (next) {
  try {
    if (!this.usdot) {
      this.usdot = undefined;
    }
    next();
  } catch (err) {
    console.warn(err);
  }
});
//  Carriers USDOT Index
 CarrierSchema.index(
  { usdot: 1,companyId: 1 },
  {
    unique: true,
    partialFilterExpression: {
    usdot: { $type: "string" }
    },
    name: "unique_carrier_company_usdot"
  }
);
// carrirs: Email
CarrierSchema.index(
  { companyId: 1, email: 1 },
  {
    unique: true,
  }
);

//  unique company name 
CarrierSchema.index({ id: 1, companyId: 1 }, { unique: true });
CarrierSchema.index({ companyId:1,company:1 }, { unique: true, });
CarrierSchema.index({ createdBy: 1 });
CarrierSchema.index({ companyId: 1 });
CarrierSchema.plugin(deleteGuardPlugin, { modelName: "Carrier" });
const Carrier = mongoose.model<ICarrier>('Carrier', CarrierSchema);
export { CarrierSchema };
export default Carrier;
