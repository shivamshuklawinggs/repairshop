import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';

export interface IPaymentTerms extends Document {
  days: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  companyId:mongoose.Types.ObjectId;
  manager?:mongoose.Types.ObjectId,
  ownerAdminId: mongoose.Types.ObjectId
}

const PaymentTermsSchema: Schema<IPaymentTerms> = new Schema({
  days: { 
    type: Number,
    required: true,
    min: 0,
    max: 90
  },
  name: { 
    type: String,
    required: true,
    trim:true,
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,'Please Add Created By'],
    immutable: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,'Please Add Updated By']
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
  companyId:{
    type:Schema.Types.ObjectId,
    ref:"companies",
    immutable: true,
    required:[true,'Please Add Company Id']
  },
}, {
  ...commonSchemaOptions,
  collection:"paymentterms",
});
// Payment Terms Schema
PaymentTermsSchema.index({ companyId: 1, name: 1 }, { unique: true }); // But allows same name across different companies
PaymentTermsSchema.index({ companyId: 1, days: 1 }, { unique: true }); // Prevents duplicate days within the same company  But allows same days across different companies
PaymentTermsSchema.index({ createdBy: 1 });
PaymentTermsSchema.index({ companyId: 1 });
//  before save check if companyid and name exist  then throw error
// ✅ Compound unique indexes for uniqueness within a company
// Prevents duplicate names within the same company
PaymentTermsSchema.plugin(deleteGuardPlugin, { modelName: "PaymentTerms" });
const PaymentTerms = mongoose.model<IPaymentTerms>('PaymentTerms', PaymentTermsSchema);
export { PaymentTermsSchema };
export default PaymentTerms; 