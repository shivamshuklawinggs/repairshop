import mongoose, { Schema, Document, Types } from "mongoose";
import { PaymentType } from "./payment.model";

export interface IPaymentAllocation extends Document {
  paymentId: Types.ObjectId;       // Original payment
  invoiceId?: Types.ObjectId;      // Optional if applied to invoice
  billId?: Types.ObjectId;         // Optional if applied to bill
  companyId: Types.ObjectId;
  amount: number;                  // Amount applied from this payment
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  PaymentType:PaymentType
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: "accountspayments", required: true ,immutable:true},
    invoiceId: { type: Schema.Types.ObjectId, ref: "accountsinvoices",immutable:true },
    billId: { type: Schema.Types.ObjectId, ref: "vendorbills",immutable:true },
    companyId: { type: Schema.Types.ObjectId, required: true, ref: "companies",immutable:true },
    amount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    PaymentType:{type:String,enum:PaymentType, required: true ,immutable:true},
  },
  { timestamps: true }
);
//  Carriers USDOT Index
 PaymentAllocationSchema.index(
  { paymentId: 1, invoiceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      invoiceId: { $type: "objectId" },
    },
    name: "unique_per_invoice"
  }
);

PaymentAllocationSchema.index(
  { paymentId: 1, billId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      billId: { $type: "objectId" },
    },
    name: "unique_per_bill"
  }
);

PaymentAllocationSchema.pre<IPaymentAllocation>('save', async function (next) {
  if (this.invoiceId && this.billId) {
    return next(new Error('A payment allocation cannot be applied to both an invoice and a bill.'));
  }
  next();
});
const PaymentAllocationModel = mongoose.model<IPaymentAllocation>(
  "paymentallocations",
  PaymentAllocationSchema
);
export { PaymentAllocationSchema };
export default PaymentAllocationModel;