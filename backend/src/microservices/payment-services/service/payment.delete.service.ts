import { Response } from "express";
import { AppError } from "middlewares/error";
import BillModal from "models/Bill.model";
import InvoiceModal from "models/Invoice.model";
import PaymentModal from "models/payment.model";
import PaymentAllocationModel from "models/PaymentAllocation.model";
import { ClientSession, Types } from "mongoose";
import { recomputeLastPaymentDate } from "./payment.lastpayment.util";

export async function paymentDelete({res,id,session}:{session:ClientSession,res:Response,id:string}) {
     // 1️⃣ Check for duplicate reference number in the same company
          const existingPayment = await PaymentModal.findByIdAndDelete(id).session(session);
          if (!existingPayment) {
            throw new AppError(`Payment not found`, 400);
          }
          await PaymentAllocationModel.deleteMany({paymentId:id},{_id:1}).session(session)
          if (existingPayment.invoiceIds?.length) {
            await InvoiceModal.bulkWrite(
              existingPayment.invoiceIds.map((invoiceId) => ({
                updateOne: {
                  filter: { _id: invoiceId, companyId: res.locals.companyId },
                  update: { $pull: { recievedPaymentAmount: { recievedPaymentId: existingPayment._id } } as any }
                }
              })),
              { session }
            );
            await recomputeLastPaymentDate(InvoiceModal, existingPayment.invoiceIds as Types.ObjectId[], res.locals.companyId, session);
          }

          if (existingPayment.billids?.length) {
            await BillModal.bulkWrite(
              existingPayment.billids.map((billId) => ({
                updateOne: {
                  filter: { _id: billId, companyId: res.locals.companyId },
                  update: { $pull: { recievedPaymentAmount: { recievedPaymentId: existingPayment._id } } as any }
                }
              })),
              { session }
            );
            await recomputeLastPaymentDate(BillModal, existingPayment.billids as Types.ObjectId[], res.locals.companyId, session);
          }
} 