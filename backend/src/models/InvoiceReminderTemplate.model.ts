import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';

export type ReminderTemplateType = 'before' | 'after' | 'on_due';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'custom';

export interface IInvoiceReminderTemplate extends Document {
  templateType: ReminderTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  // Scheduling configuration
  daysBeforeDue?: number; // For 'before' type - days before due date to start
  daysAfterDue?: number; // For 'after' type - days after due date to start
  frequency: ReminderFrequency; // How often to send reminders
  customIntervalDays?: number; // For 'custom' frequency - custom interval in days
  maxReminders?: number; // Maximum number of reminders to send
  // Time configuration
  sendTime?: string; // Time of day to send (HH:MM format)
  companyId: mongoose.Types.ObjectId;
  ownerAdminId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const InvoiceReminderTemplateSchema: Schema<IInvoiceReminderTemplate> = new Schema({
  templateType: {
    type: String,
    enum: ['before', 'after', 'on_due'],
    required: [true, 'Template type is required']
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject line is required'],
    trim: true
  },
  htmlContent: {
    type: String,
    required: [true, 'HTML content is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Scheduling configuration
  daysBeforeDue: {
    type: Number,
    min: 1,
    max: 365,
    default: 7
  },
  daysAfterDue: {
    type: Number,
    min: 1,
    max: 365,
    default: 1
  },
  frequency: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'custom'],
    default: 'once'
  },
  customIntervalDays: {
    type: Number,
    min: 1,
    max: 365,
    default: 1
  },
  maxReminders: {
    type: Number,
    min: 1,
    max: 50,
    default: 5
  },
  sendTime: {
    type: String,
    default: '09:00',
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'companies',
    immutable: true,
    required: [true, 'Company ID is required']
  },
  ownerAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
    required: [true, 'Owner admin ID is required']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
    immutable: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by is required']
  }
}, {
  ...commonSchemaOptions,
  collection: 'invoiceReminderTemplates'
});

// Compound unique index to ensure one active template per type per company
InvoiceReminderTemplateSchema.index({ companyId: 1, templateType: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for faster queries
InvoiceReminderTemplateSchema.index({ companyId: 1 });
InvoiceReminderTemplateSchema.index({ ownerAdminId: 1 });
InvoiceReminderTemplateSchema.index({ createdBy: 1 });

InvoiceReminderTemplateSchema.plugin(deleteGuardPlugin, { modelName: 'InvoiceReminderTemplate' });

const InvoiceReminderTemplate = mongoose.model<IInvoiceReminderTemplate>('InvoiceReminderTemplate', InvoiceReminderTemplateSchema);
export { InvoiceReminderTemplateSchema };
export default InvoiceReminderTemplate;