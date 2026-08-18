
import mongoose, { Schema, Document, ClientSession, Types } from 'mongoose';
import { commonSchemaOptions, CustomFieldsSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { existsValidator } from './shared/existsValidator';
import PaymentAllocationModel from './PaymentAllocation.model';
import { AppError } from 'middlewares/error';
export enum PaymentType {
    bill = "bill",
    invoice = "invoice",
}
/**
 * Sum all allocations for this payment
 */
const getAllocatedAmount = async (
    paymentId: Types.ObjectId,
    session?: ClientSession,
): Promise<number> => {
    const [row] = await PaymentAllocationModel.aggregate([
        {
            $match: {
                paymentId: new Types.ObjectId(paymentId),
            },
        }, { $group: { _id: null, total: { $sum: "$amount" }, }, },]).session(session || null);
    return row?.total || 0;
};
export interface IPayment extends Document {
    postingDate: Date;
    customerId: mongoose.Types.ObjectId;
    createdAt?: Date;
    status: "Settled" | "Unsettled";
    updatedAt?: Date;
    invoiceIds: mongoose.Types.ObjectId[];
    billids: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    paymentDate: Date;
    paymentMethod: string;
    referenceNo: string;
    depositTo: mongoose.Types.ObjectId;
    amount: number;
    PaymentType: PaymentType;
    credits: number;
    settledAmount: number;
    customFields?: Record<string, any>;
    manager?:Types.ObjectId,
    ownerAdminId: Types.ObjectId
}
const PaymentSchema: Schema<IPayment> = new Schema({
    invoiceIds:
        [{
            type: Schema.Types.ObjectId,
            ref: "accountsinvoices",

        }],
    billids:
        [{
            type: Schema.Types.ObjectId,
            ref: "vendorbills",
        }],
    amount: { type: Number, required: true, min: 0, },
    settledAmount: { type: Number, default: 0, min: 0, },

    credits: {
        type: Number, default: 0, min: 0,
    },
    status: {
        type: String,
        enum: ["Settled", "Unsettled"]
    },
    paymentDate: { type: Date, required: [true, "Payment Date Is Required"] },
    paymentMethod: { type: String, required: [true, "Payment Method Is Required"] },
    referenceNo: { type: String, trim: true, required: [true, "Please Add Reference No"], immutable: true },
    depositTo: {
        type: Schema.Types.ObjectId, required: [true, "Deposit To Is Required"], ref: "chartofaccounts", validate: {
            validator: existsValidator(
                (_ctx, value) => ({
                    _id: value,
                    
                }),
                "chartofaccounts"
            ),
            message: "Chart Of Account is not associated with this Company"
        }
    },
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "Please Add Company"],
        ref: "companies",
        immutable: true
    },
    postingDate: { type: Date, required: true },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, "Please Add Customer"],
        immutable: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
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
    required:[true,"Owner admin id is reuired"]
    },
    PaymentType: { type: String, enum: PaymentType, required: true, immutable: true },
    customFields: {
    type: CustomFieldsSchema,
    default: {}
  },
}, {
    ...commonSchemaOptions,
    collection: "accountspayments"
});
// Payment Schema
PaymentSchema.index({ createdBy: 1 });
PaymentSchema.index({ companyId: 1 });
PaymentSchema.index({ invoiceIds: 1 });
PaymentSchema.index({ billids: 1 });
PaymentSchema.index({ depositTo: 1 });
PaymentSchema.index({ customerId: 1 });
PaymentSchema.index({ referenceNo: 1, depositTo: 1, companyId: 1 }, { unique: true, name: "reference_unique_per_company_bank" })
// Apply plugins
PaymentSchema.pre("validate", async function () {
    // skip on new unsaved doc
    // if (!this._id) return;

    const session = this.$session?.() || undefined

    const allocated = await getAllocatedAmount(this._id, session);

    this.settledAmount = allocated;
    this.credits = Math.max(0, this.amount - allocated);
    this.status = this.credits === 0 ? "Settled" : "Unsettled";

    // hard validation
    if (allocated > this.amount) {
        throw new AppError(`Allocated amount (${allocated}) cannot exceed payment amount (${this.amount})`, 400);
    }
});

PaymentSchema.plugin(deleteGuardPlugin, { modelName: "accountspayments" });
const PaymentModal = mongoose.model<IPayment>('accountspayments', PaymentSchema);
export { PaymentSchema };
export default PaymentModal
