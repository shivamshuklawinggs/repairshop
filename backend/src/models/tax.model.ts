import mongoose, { Schema, Document, Types } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { existsValidator } from './shared/existsValidator';

export interface ITaxService extends Document {
  label: string;
  value: number;
  createdAt?: Date;
  updatedAt?: Date;
  ChartOfAccountId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
    manager?: Types.ObjectId,
    ownerAdminId: Types.ObjectId
}

const TaxServiceSchema: Schema<ITaxService> = new Schema({

  label: { type: String, required: true, trim: true, },
  value: {
    type: Schema.Types.Number,
    required: true,
    min: 1,
    max: 100
  },
  ChartOfAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'chartofaccounts',
    validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "chartofaccounts"
      ),
      message: "Chart Off Account is not associated with this Company"
    },
    required: [true, 'Please Add Chart Of Account Id']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
    required: [true, 'Please Add Created By']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please Add Updated By']
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "companies",
    immutable: true,
    required: [true, 'Please Add Company Id']
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
}, {
  ...commonSchemaOptions,
  collection: "taxservices",
});
//  Tax Service Schema
TaxServiceSchema.index({ companyId: 1, label: 1 }, { unique: true });
TaxServiceSchema.index({ createdBy: 1 });
TaxServiceSchema.index({ companyId: 1 });
TaxServiceSchema.plugin(deleteGuardPlugin, { modelName: "taxservices" });
const TaxService = mongoose.model<ITaxService>('taxservices', TaxServiceSchema);

export { TaxServiceSchema };
export default TaxService
