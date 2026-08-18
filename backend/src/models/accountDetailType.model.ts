import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { IAccountTypeEnum, masterType,alltypes,masterTypes } from './AccountType.model';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';

export interface IAccountDetailType extends Document {
  desc: string;
  name: string;
  typeId: string;
  type: IAccountTypeEnum;
  masterType:masterType;
  detailTypeId: string;
  detailType: string;
  AccountTypeId: mongoose.Types.ObjectId;
}

const AccountDetailTypeSchema: Schema<IAccountDetailType> = new Schema({
  name: { type: String, required: true, trim: true, unique: false },
  desc: { type: String, required: true, trim: true },
  typeId: { type: String, required: true, trim: true },
  type: {
      type: String,
      required: true,
      default: IAccountTypeEnum.ASSET,
      enum: alltypes,
      trim: true,
      
    },
    masterType: {
      type: String,
      default: masterType.other,
      enum: masterTypes,
      required:true,
      trim: true
    },
  detailTypeId: { type: String, required: true, trim: true, unique: true  },
  detailType: { type: String, required: true, trim: true, unique: true },
  AccountTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'Accounttypes',
    required: true,
  },
}, {
  ...commonSchemaOptions,
  collection: 'accountdetailtypes'
});
AccountDetailTypeSchema.index(
  { masterType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      masterType: { $in: [masterType.customer, masterType.vendor,masterType.retainedearnings] },
    },
  }
);
AccountDetailTypeSchema.index({ AccountTypeId: 1 });
AccountDetailTypeSchema.index({ typeId: 1 });
AccountDetailTypeSchema.plugin(deleteGuardPlugin, { modelName: "accountdetailtypes" });
const AccountDetailType = mongoose.model<IAccountDetailType>('accountdetailtypes', AccountDetailTypeSchema);
export { AccountDetailTypeSchema };
export default AccountDetailType;
