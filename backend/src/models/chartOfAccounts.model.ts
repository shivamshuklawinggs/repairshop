
import mongoose, { Schema, Document, Types } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { IAccountTypeEnum, IAccountType, masterType, masterTypes, alltypes } from './AccountType.model';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import {  defaultChartsDetailTypeidIdsEnum } from 'microservices/chart-accounts-services/services/Accounttypes.service';
import { IAccountDetailType } from './accountDetailType.model';
import { reservedNamePlugin } from './plugins/reservedName.plugin';

export interface IChartOfAccount extends Document {
  name: string;
  accountType: mongoose.Types.ObjectId;
  detailType: mongoose.Types.ObjectId;
  typeId: string;
  isSubAccount: boolean;
  AccountId?: mongoose.Types.ObjectId | null;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  chartOfAccountNumber?: string;
  masterType: masterType;
  type: IAccountTypeEnum;
  accountTypeData: IAccountType;
  detailTypeData: IAccountDetailType;
  manager?:Types.ObjectId,
  ownerAdminId:Types.ObjectId
  readonly:boolean;
  SystemAccount:boolean;
  isLoad:boolean
}

const ChartOfAccountSchema: Schema<IChartOfAccount> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    default: IAccountTypeEnum.ASSET,
    enum: Object.values(IAccountTypeEnum),
    trim: true,
    immutable:true
  },
  accountType: {
    type: Schema.Types.ObjectId,
    ref: 'Accounttypes',
    required: true,
    immutable:true
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
  detailType: {
    type: Schema.Types.ObjectId,
    ref: 'accountdetailtypes',
    required: true,
    immutable:true

  },
  typeId: {
    type: String,
    ref: 'Accounttypes',
    required: true,
  },
  isSubAccount: {
    type: Boolean,
    default: false
  },
  AccountId: {
    type: Schema.Types.ObjectId,
    ref: 'chartofaccounts',
    default: null
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
    ref: 'companies',
    required: [true, 'Please Add Company Id'],
    immutable: true
  },
  masterType: {
    type: String,
    default: masterType.other,
    enum: masterTypes,
    immutable:true
  },
  id: {
    type: String,
    trim: true,
    required: true
  },
  accountTypeData: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Accounttypes',
      required: true,
      immutable:true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      immutable:true
    },
    type: {
      type: String,
      required: true,
      default: IAccountTypeEnum.ASSET,
      enum: Object.values(IAccountTypeEnum),
      trim: true,
       immutable:true
    },
    masterType: {
      type: String,
      default: masterType.other,
      enum: masterTypes,
      immutable:true
    },
    typeId: { type: String, required: true, trim: true, immutable:true},
    detailTypeId: { type: String, required: true, trim: true,immutable:true },
    detailType: { type: String, required: true, trim: true,immutable:true },
  },
  detailTypeData: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'accountdetailtypes',
      required: true,
      immutable:true
    },
    name: { type: String, required: true, trim: true,immutable:true },
    typeId: { type: String, required: true, trim: true ,immutable:true},
    type: {
      type: String,
      required: true,
      default: IAccountTypeEnum.ASSET,
      enum: alltypes,
      trim: true,
      immutable:true
    },
    masterType: {
      type: String,
      default: masterType.other,
      enum: masterTypes,
      required: true,
      trim: true,
      immutable:true
    },
    detailTypeId: { type: String, required: true, trim: true,immutable:true },
    detailType: { type: String, required: true, trim: true ,immutable:true},
    AccountTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'Accounttypes',
      required: true,
      immutable:true
    },
   
  },
  readonly: {
    type: Boolean,
    default: false,
    immutable:true
  },
  SystemAccount: {
    type: Boolean,
    default: false,
    immutable:true
  },
  isLoad: {
    type: Boolean,
    default: false,
    immutable:true
  }
}, {
  ...commonSchemaOptions,
  collection: 'chartofaccounts'
});
// Compound unique index: name must be unique per company
ChartOfAccountSchema.index({ companyId: 1, name: 1 }, { unique: true });
// Unique index on detailTypeId to prevent recreating default accounts (only for SystemAccount)
ChartOfAccountSchema.index({ companyId: 1, detailType: 1 }, { unique: true, partialFilterExpression: { SystemAccount: true }});
ChartOfAccountSchema.index(
  { companyId: 1, "detailTypeData.detailType": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "detailTypeData.detailType": { $in: Object.values(defaultChartsDetailTypeidIdsEnum) },
    },
  }
);
ChartOfAccountSchema.index(
  { companyId: 1, masterType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      masterType: { $in: [masterType.customer, masterType.vendor, masterType.retainedearnings] },
    },
  }
)
ChartOfAccountSchema.index({ id: 1, companyId: 1 }, { unique: true });
ChartOfAccountSchema.index({ createdBy: 1 })
ChartOfAccountSchema.index({ companyId: 1 })
ChartOfAccountSchema.index({ accountType: 1 })
ChartOfAccountSchema.index({ detailType: 1 })
ChartOfAccountSchema.index({ masterType: 1 })
ChartOfAccountSchema.index({ type: 1 })
ChartOfAccountSchema.index({ AccountId: 1 })
ChartOfAccountSchema.plugin(deleteGuardPlugin, {
  modelName: "chartofaccounts",
  protectedFields: [
    {
      field: "SystemAccount",
      values: [true],
      message:
        "This account is system-protected and cannot be deleted because it is a default chart of account.",
    },
  ],
});
ChartOfAccountSchema.plugin(reservedNamePlugin, {
  reservedNames: Object.values(defaultChartsDetailTypeidIdsEnum),
});
ChartOfAccountSchema.plugin(reservedNamePlugin, {
  reservedNames: Object.values(defaultChartsDetailTypeidIdsEnum),
  field:"detailTypeData.detailType",

});
const ChartOfAccount = mongoose.model<IChartOfAccount>('chartofaccounts', ChartOfAccountSchema);
export { ChartOfAccountSchema };
export default ChartOfAccount; 
