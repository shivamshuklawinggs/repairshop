import mongoose, { Document, Schema } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';

export interface IEmailDailyCount extends Document {
  date: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmailDailyCountSchema: Schema<IEmailDailyCount> = new Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    ...commonSchemaOptions,
    collection: 'email_daily_counts',
  }
);

const EmailDailyCount = mongoose.model<IEmailDailyCount>('EmailDailyCount', EmailDailyCountSchema);

export default EmailDailyCount;
