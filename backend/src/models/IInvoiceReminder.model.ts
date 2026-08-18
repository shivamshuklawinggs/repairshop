import moment from "moment";
import { ClientSession, Document, model, Schema, Types } from "mongoose";

export type ReminderStatus = "sent" | "failed";

export interface IInvoiceReminderInput {
  invoiceId: Types.ObjectId;
  companyId: Types.ObjectId;
  customerId: Types.ObjectId;
  type:  "Paid Late" | "Paid" |  "Partial (Late)"| "Overdue" |"Partial"|  "Upcoming" | "Due Today";
  status: ReminderStatus;
  email?: string;
  errorMessage?: string;
  session?:ClientSession;
  ownerAdminId:Types.ObjectId;
  templateId?: Types.ObjectId; // Track which template was used
  reminderCount?: number; // Track which reminder number this is (1, 2, 3, etc.)
}

export interface IInvoiceReminder extends Document {
  _id?: Types.ObjectId;
  invoiceId: Types.ObjectId;
  companyId: Types.ObjectId;
  customerId: Types.ObjectId;
  type:  "Paid Late" | "Paid" |  "Partial (Late)"| "Overdue" |"Partial"|  "Upcoming" | "Due Today";
  status: ReminderStatus;
  email?: string;
  sentAt?: Date;
  attempt?: number;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  manager?: Types.ObjectId,
  ownerAdminId:Types.ObjectId
  templateId?: Types.ObjectId; // Track which template was used
  reminderCount?: number; // Track which reminder number this is (1, 2, 3, etc.)
}

const InvoiceReminderSchema:Schema<IInvoiceReminder> = new Schema(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
     
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "companies",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    type: {
      type: String,
      required: true,
      enum:[ "Paid Late" , "Paid" ,  "Partial (Late)", "Overdue" ,"Partial", "Upcoming" , "Due Today"]
    },

    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true
    },

    email: String,

    sentAt: {
      type: Date,
      default: Date.now,
    },

    attempt: {
      type: Number,
      default: 1
    },

    errorMessage: String,
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
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InvoiceReminderTemplate',
      optional: true
    },
    reminderCount: {
      type: Number,
      default: 1
    },
  },
  {
    timestamps: true,
    collection:"invoicereminders"
  }
);

// 🔥 Important indexes
InvoiceReminderSchema.index({ invoiceId: 1, sentAt: -1 });
InvoiceReminderSchema.index({ companyId: 1, sentAt: -1 });
export const InvoiceReminder = model<IInvoiceReminder>(
  "InvoiceReminder",
  InvoiceReminderSchema
);
// canSendReminder
export const createInvoiceReminder = async ({
  invoiceId,
  companyId,
  customerId,
  type,
  status,
  email,
  errorMessage,
  session,
  ownerAdminId,
  templateId,
  reminderCount
}: IInvoiceReminderInput) => {
  try {
    const now = moment()
    const [data]= await InvoiceReminder.create([{
      invoiceId,
      companyId,
      customerId,
      type,
      status,
      email,
      errorMessage,
      ownerAdminId,
      templateId,
      reminderCount: reminderCount || 1,
      sentAt: now.toDate(),
    }],{session});
    return data
  } catch (error: any) {
    if (error.code === 11000) {
      // already sent today
      return null;
    }
    throw error;
  }
};

