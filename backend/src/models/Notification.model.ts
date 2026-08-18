import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';

export interface INotification extends Document {
  _id?:Schema.Types.ObjectId;
  referenceId:mongoose.Types.ObjectId;
  referenceNumber:string;
  message: string;
  title:string;
  createdAt?: Date;
  updatedAt?: Date;
  isRead: boolean;
  UserId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type:"Follow-up Load Expense"| "Follow-up Load" | "Pickup Ready" | "ProductServiceReminer" | "Delivery Ready"
}

const NotesSchema: Schema<INotification> = new Schema({
  message: {type:String,required:[true,"message is Required"]},
  title: {type:String,required:[true,"title is Required"]},
  referenceNumber: {type:String},
  UserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,"User  Is Required"]
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    
  },
  type:{
    type:String,
    enum:["Follow-up Load Expense","Follow-up Load","Pickup Ready","ProductServiceReminer","Delivery Ready"],
    default:"Follow-up Load Expense"
  },
  companyId:{
    type:Schema.Types.ObjectId,
    ref:"Company"
  },
  isRead:{
    type:Boolean,
    default:false
  }
}, {
   ...commonSchemaOptions,
   collection:"notifications",
});
NotesSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
NotesSchema.index({ isRead: 1 ,companyId:1});
const Notification = mongoose.model<INotification>('Notifications', NotesSchema);

export default Notification
