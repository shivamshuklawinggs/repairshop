import mongoose, { Document, Schema, Types } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';

export interface IUserPlanDocument extends Document {
  name: string;
  description: string;
  price: number;
  noOfUsers: number;
  isActive: boolean;
  noOfDays: number;
  noOfCompanies: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isUnlimited:boolean
}

const userPlanSchema: Schema<IUserPlanDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
        required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      default: 0,
      required: [true, 'Price is required'],
    },
    noOfUsers: {
      type: Number,
      required: [true, 'Max sessions is required'],
      min: 1,
      max: 100,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
    noOfDays: {
      type: Number,
      default: 15,
      min:1,
      required: [true, 'No of days is required'],
    },
    noOfCompanies: {
      type: Number,
      required: [true, 'No of companies is required'],
      default: 1,
      min: [1, 'Minimum 1 company is required'],
      max: [100, 'Maximum 1000 companies allowed'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      immutable: true,
      required: [true, 'Created by is required'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },

  {
    ...commonSchemaOptions,
    collection:"plans",
  }
);
userPlanSchema.index({ createdBy: 1 });
userPlanSchema.plugin(deleteGuardPlugin, { modelName: "Plan" });
const UserPlan = mongoose.model<IUserPlanDocument>('Plan', userPlanSchema);

export default UserPlan;
