import { Schema,Types, model, Document } from 'mongoose';
import { IFile } from 'types/file';
import { commonSchemaOptions, FileSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import ChartOfAccount from './chartOfAccounts.model';
import { IAccountTypeEnum, masterType } from './AccountType.model';
import { AppError } from 'middlewares/error';
import { defaultChartsDetailTypeidIdsEnum } from 'microservices/chart-accounts-services/services/Accounttypes.service';
export type nameModelType = 'Customer' | 'Carrier' | null;
export interface IJournalEntry extends Document {
  journalDate: Date;
  postingDate: Date;
  deleted?: string;
  journalNumber: string;
  entries: {
    _id?: Types.ObjectId;
    account: Types.ObjectId;
    nameId: Types.ObjectId;
    debit: number;
    credit: number;
    description: string;
    nameModel: nameModelType;
  }[];
  memo: string;
  attachments?: IFile;
  companyId: Types.ObjectId;
  totalDebit: number;
  totalCredit: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  manager?:Types.ObjectId,
  ownerAdminId: Types.ObjectId

}
const EntrySchema =new Schema<IJournalEntry["entries"][0]>({
        account: {
          type: Schema.Types.ObjectId,
          ref: 'chartofaccounts',
          required: true,
          validate: {
            validator: async function(value: Types.ObjectId) {
              const account = await ChartOfAccount.findById(value);
              if(account && account.masterType===masterType.retainedearnings ){
                throw new AppError("Retain Earnings Account is Not Allowed",40)
              }
              else if (account && account.name === defaultChartsDetailTypeidIdsEnum.CLEARING && account.detailTypeData.detailTypeId == "1020" && account.type === IAccountTypeEnum.ASSET) {
                throw new AppError("Clearing Account is Not Allowed", 40)
              }
              return !!account;
            },
            message: "Chart Of Account is not associated with this Company"
          },
        },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
        description: { type: String },
        nameId: {
          type: Schema.Types.ObjectId,
          refPath: 'entries.nameModel',
          default: null,
        },
        nameModel: {
          type: String,
          enum: ['Customer', 'Carrier', null],
          default: null,
        },
     
      },{
        timestamps:true
      })
const journalEntrySchema = new Schema<IJournalEntry>(
  {
    journalDate: { type: Date, required: true },
    postingDate: { type: Date, required: true },
    journalNumber: { type: String, required: true },
    entries: [EntrySchema ],
    memo: { type: String },
    attachments:FileSchema,
    companyId: {
      type: Schema.Types.ObjectId,
      ref:"companies",
      required: true,
      immutable: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please Add Created By'],
      immutable: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please Add Updated By']
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
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
  },
  {
    ...commonSchemaOptions,
    collection: "journalentries",
  }
);
// Journal Entry Schema
journalEntrySchema.index({ journalNumber: 1, companyId: 1 }, { unique: true });
journalEntrySchema.index({ createdBy: 1 });
journalEntrySchema.index({ companyId: 1 });
journalEntrySchema.index({ "entries.nameId": 1 });
journalEntrySchema.index({ "entries.account": 1 });
journalEntrySchema.index({ "entries.nameModel": 1 });
journalEntrySchema.plugin(deleteGuardPlugin, { modelName: "JournalEntry" });

const JournalEntry = model<IJournalEntry>('JournalEntry', journalEntrySchema);
export { journalEntrySchema };
export default JournalEntry;
