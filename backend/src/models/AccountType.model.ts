import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
export enum IAccountTypeEnum {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  INCOME = "income",
  EXPENSE = "expense"
}
export enum masterType {
  customer="customer",other="other",vendor="vendor",retainedearnings="retainedearnings"
}
export interface IAccountType extends Document {
    name: string;
    type: IAccountTypeEnum;
    masterType:masterType;
    desc:string,
    typeId:string,
    detailTypeId:string,
    detailType:string,
}

export const balanceSheets=[IAccountTypeEnum.ASSET,IAccountTypeEnum.LIABILITY,IAccountTypeEnum.EQUITY]; // balance sheet accounts
export const balanceSheetsCredit=[IAccountTypeEnum.LIABILITY,IAccountTypeEnum.EQUITY,IAccountTypeEnum.INCOME]; // balance sheet accounts credit
export const balanceSheetsDebit=[IAccountTypeEnum.ASSET,IAccountTypeEnum.EXPENSE]; // balance sheet accounts debit
export const profitAndLoss=[IAccountTypeEnum.INCOME,IAccountTypeEnum.EXPENSE]; // income and expense accounts
export const masterTypes=Object.values(masterType)
export const alltypes=Object.values(IAccountTypeEnum)


const AccountTypeSchema: Schema<IAccountType> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true 
  },
  type: {
    type: String,
    required: true,
    default: IAccountTypeEnum.ASSET,
    enum: Object.values(IAccountTypeEnum),
    trim: true
  },
  masterType: {
    type: String,
    default:masterType.other,
    enum: masterTypes
  },
  desc: { type: String, required: true, trim: true },
  typeId: { type: String, required: true, trim: true, unique: true },
  detailTypeId: { type: String, required: true, trim: true },
  detailType: { type: String, required: true, trim: true },

}, {
...commonSchemaOptions,
  collection: 'parentaccounttypes'
});
//  Account Types Schemas
AccountTypeSchema.index({ type: 1 });
AccountTypeSchema.index({ masterType: 1 });
AccountTypeSchema.index({ typeMnemonic: 1 });
AccountTypeSchema.index({ typeEnumName: 1 });
AccountTypeSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Delete operations are not allowed on this collection');
});
const AccountTypeModel = mongoose.model<IAccountType>('Accounttypes', AccountTypeSchema);
export { AccountTypeSchema };
export default AccountTypeModel;
