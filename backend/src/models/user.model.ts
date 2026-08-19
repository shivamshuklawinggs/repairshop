import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { Role, ROLES } from 'microservices/auth-service/types';
import {  commonSchemaOptions } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { planLimitPlugin } from './plugins/user.plan.imit.plugin';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  visibleCompany: Types.ObjectId[];
  role: Role;
  isActive: boolean;
  margin: number;
  isBlocked: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  manager?: Types.ObjectId;
  ownerAdminId?: Types.ObjectId;
  ActivePlan?: {
    PlanId: Types.ObjectId;
    expires: Date;
  };
  matchPassword(enteredPassword: string, password: string): Promise<boolean>;
  resetPasswordToken?: string;
 
  resetPasswordExpire?: Number;
  extentionNo: string;
  phone: string;
  country?: string;
  ipAddress?: string;
}


const userSchema: Schema<IUserDocument> = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  extentionNo: { type: String, required: false },
  phone: { type: String },
  country: { type: String, required: false },
  ipAddress: { type: String, required: false },
  ActivePlan: {
    PlanId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      default: undefined
    },
    expires: {
      type: Date,
      default: undefined
    }
  },
  
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  ownerAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  visibleCompany: [
    {
      type: Schema.Types.ObjectId,
      ref: "companies"
    }
  ],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Number
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ROLES,
    immutable: true
  },
  isActive: { type: Boolean, default: true },
  margin: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  ...commonSchemaOptions,
  collection: "users",
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for access-control lookups
userSchema.index({ createdBy: 1 });
userSchema.index({ ownerAdminId: 1 });
userSchema.index({ manager: 1 });
userSchema.index({ visibleCompany: 1 });
userSchema.index({ role: 1 });
const createhashPassword = async (password: string) => {
  const salt = parseInt(process.env.SALT_ROUNDS as string);
  return await bcrypt.hash(password, salt);
};
userSchema.pre<IUserDocument>('save', async function (next) {


  if (this.isNew || this.isModified('password')) {
    this.password = await createhashPassword(this.password);
  }


  next();
});
userSchema.plugin(planLimitPlugin)

userSchema.methods.matchPassword = async function (enteredPassword: string, password: string): Promise<boolean> {
  if (!enteredPassword || !password) {
    throw new Error('Password and hash are required for comparison');
  }
  return bcrypt.compare(enteredPassword, password);
};

userSchema.plugin(deleteGuardPlugin, { modelName: "User" });
const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;