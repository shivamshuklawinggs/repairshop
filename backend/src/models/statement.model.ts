

import mongoose, { Schema, Document, Types } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';
export const invoiceStatusEnums = ["Pending", "Partial", "Paid", "Overdue", "Cancelled", "Close"] as const;

export type InvoiceStatusEnum = typeof invoiceStatusEnums[number];

export interface IStatement extends Document {
    data: [{
        _id: Types.ObjectId,
        invoiceNumber: string,
        status: InvoiceStatusEnum,
        invoiceDate: Date,
        dueDate: Date,
        BillNumber: string,
        recievedAmount: number,
        overbalanceDue: number,
        totalAmount: number,
        balanceDue: number,
        vendorId: Types.ObjectId,
    }],
    customerId: Types.ObjectId,
    vendorId: Types.ObjectId,
    account: boolean,
    totalBalance: number,
    totalRecievedAmount: number,
    totalBalanceDue: number,
    companyId: mongoose.Types.ObjectId;
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    manager?: Types.ObjectId,
    ownerAdminId: Types.ObjectId
}

const StatementSchema: Schema<IStatement> = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        immutable: true
    },
    data: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'accountinvoices',
            immutable: true
        },
        invoiceNumber: {
            type: String,
            required: true,
            immutable: true
        },
        status: {
            type: String,
            enum: invoiceStatusEnums,
            default: invoiceStatusEnums[0],
            immutable: true
        },
        invoiceDate: {
            type: Date,
            required: true,
            immutable: true
        },
        dueDate: {
            type: Date,
            required: true,
            immutable: true
        },
        recievedAmount: {
            type: Number,
            default: 0,
            immutable: true
        },
        totalAmount: {
            type: Number,
            default: 0,
            immutable: true
        },
        balanceDue: {
            type: Number,
            default: 0,
            immutable: true
        },
    }],
    totalBalance: {
        type: Number,
        default: 0,
        immutable: true
    },
    totalRecievedAmount: {
        type: Number,
        default: 0,
        immutable: true
    },
    totalBalanceDue: {
        type: Number,
        default: 0,
        immutable: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "Please Add Company"],
        ref: "companies",
        immutable: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        immutable: true,
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        required: [true, "Owner admin id is reuired"]
    },
}, {
    ...commonSchemaOptions,
    collection: "accountstatements",
});
//  statmement Schema
StatementSchema.index({ customerId: 1 })
StatementSchema.index({ createdBy: 1 })
StatementSchema.index({ companyId: 1 })

// pre save 
const StatementModal = mongoose.model<IStatement>('accountstatements', StatementSchema);
export { StatementSchema };
export default StatementModal;
