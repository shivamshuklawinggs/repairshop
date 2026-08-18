
import mongoose, { Schema, Document, Types } from 'mongoose';
import { PaymentMethods, CustomerStatus } from 'types/enum';
import { IFile } from 'types/file';
import { FileSchema, commonSchemaOptions, AddressSchema, IAddress, CustomFieldsSchema, EntityDetailsSchema, IEntityDetails, IInvoiceBilSummary } from './shared/schemas';
import { generateUniqueId } from './universalid.model';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin'

export interface ICustomer extends Document {
  autoScore: number;   // 0–100
  stars: number;       // 0–5  (autoScore / 20)
  platformRate: {
    autoScore: number;   // 0–100
    stars: number;
  }
  testing?: boolean;
  company: string;
  nickName?: string;
  email?: string;
  phone?: string;
  alternatphone?: string;
  address?: string;
  state?: string;
  zipCode?: string;
  mcNumber?: string;
  usdot?: string;
  entityDetails?: IEntityDetails;
  insurerCompany?: string;
  agentName?: string;
  agentAddress?: string;
  agentExtentionNo?: string;
  agentEmail?: string;
  agentPhoneNumber?: string;
  paymentMethod?: string;
  paymentTerms?: Types.ObjectId;
  vatNumber?: string;
  utrNumber?: string;
  status?: CustomerStatus;
  documents?: IFile[];
  displayCustomerName: string;
  mobileNo: string;
  fax: string;
  other: string;
  website: string;
  nameToPrintOnCheck: string;
  isSubCustomer: boolean;
  parentCustomer?: Types.ObjectId;
  billingAddress?: IAddress;
  shippingAddress?: IAddress;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  extentionNo?: string;
  id: string;
  customFields?: Record<string, any>;
  manager?: Types.ObjectId,
  ownerAdminId: Types.ObjectId;
  city?: string;
  deleteFiles?: string[];
  withoutUsdot?: boolean;
  sameAsBillingAddress?: boolean;
  summary?: IInvoiceBilSummary;
  truckDetails?: {
    vinNumber: string;
    licenseNumber: string
  }
}

const CustomerSchema: Schema<ICustomer> = new Schema<ICustomer>({
  truckDetails: {
    vinNumber: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: 17,
      maxlength: 17,
      immutable: true
    },
    licenseNumber: { type: String },
  },
  summary: {
    subTotal: { type: Number, default: 0, },
    taxTotal: { type: Number, default: 0, },
    discount: { type: Number, default: 0, },
    finalAmount: { type: Number, default: 0, },
    totalRecieved: { type: Number, default: 0, },
    balanceDue: { type: Number, default: 0, },
  },
  autoScore: { type: Number, default: 50, min: 0, max: 100 },
  stars: { type: Number, default: 2.5, min: 0, max: 5 },
  platformRate: {
    autoScore: { type: Number, default: 50, min: 0, max: 100 },
    stars: { type: Number, default: 2.5, min: 0, max: 5 },
  },
  testing: { type: Boolean, required: false, default: false },
  company: { type: String, required: false },
  nickName: { type: String, required: false },
  email: { type: String, required: [true, "Email Is Required"] },
  usdot: {
    type: String, // required only when NOT vendor
    required: false,
  },
  phone: { type: String, required: [true, "Phone No Is Required"] },
  alternatphone: { type: String, required: false },
  extentionNo: { type: String, required: false },
  address: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  mcNumber: { type: String, required: false },
  entityDetails: { type: EntityDetailsSchema, required: false },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethods),
    required: false
  },
  paymentTerms: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentTerms',
    required: false
  },
  vatNumber: { type: String, required: false },
  utrNumber: { type: String, required: false },
  documents: [FileSchema],
  insurerCompany: { type: String, default: "" },
  agentExtentionNo: { type: String },
  agentName: { type: String, default: "" },
  agentAddress: { type: String, default: "" },
  agentEmail: { type: String, default: "" },
  agentPhoneNumber: { type: String, default: "" },
  createdBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Please Add Created By'],
    immutable: true,
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Please Add Updated By']
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "companies",
    required: [true, 'Please Add Company Id'],
    immutable: true
  },
  status: { type: String, enum: Object.values(CustomerStatus), default: CustomerStatus.ACTIVE },
  mobileNo: { type: String, required: false },
  fax: { type: String, required: false },
  other: { type: String, required: false },
  website: { type: String, required: false },
  nameToPrintOnCheck: { type: String, required: false },
  displayCustomerName: { type: String },
  isSubCustomer: { type: Boolean },
  parentCustomer: { type: Schema.Types.ObjectId, ref: "AccountsCustomer" },
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,
  notes: String,
  id: { type: String, trim: true, required: true },
  customFields: {
    type: CustomFieldsSchema,
    default: {}
  },
  city: { type: String, required: false },
  withoutUsdot: { type: Boolean },
  sameAsBillingAddress: { type: Boolean },
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
}, {
  ...commonSchemaOptions,
  collection: "customers"
});
CustomerSchema.pre<ICustomer>('save', async function (next) {
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
// validate if id does not exist then create 
CustomerSchema.pre("validate", async function (next) {
  if (!this.id) {
    const session = this.$session() || undefined
    this.id = await generateUniqueId({
      prefix: "CUSTOMER-",
      session: session,
      companyId: this.companyId
    })
  }
  next();
});
//  Customer Schemas
CustomerSchema.index(
  { companyId: 1, usdot: 1 },
  { unique: true, partialFilterExpression: { usdot: { $type: "string" } } }
);
CustomerSchema.index(
  { companyId: 1, "truckDetails.vinNumber": 1 },
  { unique: true, partialFilterExpression: { "truckDetails.vinNumber": { $type: "string" } } }
);

CustomerSchema.index({ companyId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
CustomerSchema.index({ phone: 1, companyId: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
CustomerSchema.index({ id: 1, companyId: 1 }, { unique: true });
CustomerSchema.index({ createdBy: 1 });
CustomerSchema.index({ companyId: 1 });
CustomerSchema.plugin(deleteGuardPlugin, { modelName: "Customer" });
const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export { CustomerSchema as CustomerModelSchema };
export default Customer;
