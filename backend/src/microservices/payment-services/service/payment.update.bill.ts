import mongoose, { Types, ClientSession, Document } from "mongoose";
import PaymentModal, { PaymentType } from "models/payment.model";
import { Response, Request } from "express";
import PaymentAllocationModel, {
  IPaymentAllocation,
} from "models/PaymentAllocation.model";
import BillModal from "models/Bill.model";
import { UpdateRecievedPamentSchemaType } from "../payment.validate";
import { ledgerAdapter, TransactionType } from "models/Ledger.model";
import { recomputeLastPaymentDate } from "./payment.lastpayment.util";
/**
 * PaymentService - Handles all payment allocation operations
 *
 * @description Manages payment allocations for invoices and bills with proper
 * tracking through PaymentAllocation model. Automatically updates summaries
 * and maintains audit trails.
 */
class PaymentService {
  /**
   * Create payment allocation records one by one to get unique IDs
   */
  private async createAllocations(
    allocations: Omit<IPaymentAllocation, keyof Document>[],
    session: ClientSession,
  ): Promise<{ id: Types.ObjectId; amount: number }[]> {
    const allocationIds: { id: Types.ObjectId; amount: number }[] = [];

    for (const allocation of allocations) {
      const [created] = await PaymentAllocationModel.create([allocation], {
        session,
      });
      allocationIds.push({ id: created._id, amount: created.amount });
    }

    return allocationIds;
  }

  /**
   * Update bill payment allocations
   *
   * @description Updates existing payment allocations by:
   * 1. Handle deletedPayments - permanently delete allocations and remove from bills
   * 2. Update existing allocations (from recievedPayments) in place
   * 3. Create new allocations (from invoicePayments)
   * 4. Update bill summaries and payment document
   */
  public async updateBillPayment({
    id,
    payload,
    reqBody,
    session,
    res,
    req,
  }: {
    id: string;
    payload: UpdateRecievedPamentSchemaType;
    reqBody: any;
    session: ClientSession;
    res: Response;
    req: Request;
  }): Promise<void> {
    const companyId = res.locals.companyId as unknown as Types.ObjectId;
    const userId = req.user?._id!;
    const affectedBillIds = new Set<string>();

    // 1. Handle deletedPayments - permanently delete
    if (payload.deletedPayments && payload.deletedPayments.length > 0) {
      const deletedAllocationIds = payload.deletedPayments.map(
        (p) => new mongoose.Types.ObjectId(p.PaymentAllocateId),
      );

      const allocationsToDelete = await PaymentAllocationModel.find(
        { _id: { $in: deletedAllocationIds }, companyId },
        { _id: 1, billId: 1 },
        { session },
      );

      allocationsToDelete.forEach((a) => {
        if (a.billId) affectedBillIds.add(a.billId.toString());
      });

      // Batch update bills using bulkWrite
      if (allocationsToDelete.length > 0) {
        await BillModal.bulkWrite(
          allocationsToDelete.map((allocation) => ({
            updateOne: {
              filter: { _id: allocation.billId as Types.ObjectId, companyId },
              update: {
                $pull: {
                  recievedPaymentAmount: {
                    PaymentAllocateId: allocation._id,
                  },
                } as any,
              },
            },
          })),
          { session },
        );

        await PaymentAllocationModel.deleteMany(
          { _id: { $in: deletedAllocationIds }, companyId },
          { session },
        );
        await recomputeLastPaymentDate(
          BillModal,
          allocationsToDelete.map((a) => a.billId),
          companyId,
          session,
        );
      }
    }

    // 2. Update existing allocations (recievedPayments) in place
    if (payload.recievedPayments && payload.recievedPayments.length > 0) {
      const recievedPayments = payload.recievedPayments;

      recievedPayments.forEach((p) =>
        affectedBillIds.add(p.invoiceId.toString()),
      );

      // Batch update allocations
      await PaymentAllocationModel.bulkWrite(
        recievedPayments.map((allocation) => ({
          updateOne: {
            filter: { _id: allocation.PaymentAllocateId, companyId },
            update: {
              $set: {
                amount: allocation.amount,
                updatedBy: userId,
              },
            },
          },
        })),
        { session },
      );

      // Batch update bill payment amounts
      await BillModal.bulkWrite(
        recievedPayments.map((allocation) => ({
          updateOne: {
            filter: {
              _id: new Types.ObjectId(allocation.invoiceId),
              companyId: new Types.ObjectId(companyId),
            },
            update: {
              $set: {
                "recievedPaymentAmount.$[elem].amount": allocation.amount,
              },
              //  Always keep latest payment date
              $max: {
                lastPaymentDate: reqBody.paymentDate,
              },
            },
            arrayFilters: [
              {
                "elem._id": new Types.ObjectId(allocation._id),
                "elem.PaymentAllocateId": new Types.ObjectId(
                  allocation.PaymentAllocateId,
                ),
              },
            ],
          },
        })),
        { session },
      );
    }

    // 3. Handle invoicePayments - increment existing or create new allocations
    if (payload.invoicePayments && payload.invoicePayments.length > 0) {
      // Get existing allocations for this payment
      const existingAllocations = await PaymentAllocationModel.find(
        {
          paymentId: new mongoose.Types.ObjectId(id),
          billId: {
            $in: payload.invoicePayments.map(
              (p) => new mongoose.Types.ObjectId(p.invoiceId),
            ),
          },
          companyId,
        },
        { billId: 1, amount: 1 },
        { session },
      );

      const existingBillMap = new Map(
        existingAllocations.map((a) => [a.billId!.toString(), a]),
      );

      const billsToIncrement: Array<{
        invoiceId: string;
        amount: number;
        allocationId: Types.ObjectId;
      }> = [];
      const billsToCreate: Array<{ invoiceId: string; amount: number }> = [];

      // Separate bills into increment vs create
      payload.invoicePayments.forEach(({ invoiceId, amount }) => {
        const existing = existingBillMap.get(invoiceId.toString());
        if (existing) {
          billsToIncrement.push({
            invoiceId: invoiceId.toString(),
            amount,
            allocationId: existing._id,
          });
        } else {
          billsToCreate.push({ invoiceId: invoiceId.toString(), amount });
        }
      });

      // Increment existing allocations
      if (billsToIncrement.length > 0) {
        await PaymentAllocationModel.bulkWrite(
          billsToIncrement.map(({ allocationId, amount }) => ({
            updateOne: {
              filter: { _id: allocationId, companyId },
              update: {
                $inc: { amount: amount },
                $set: { updatedBy: userId },
              },
            },
          })),
          { session },
        );

        // Update bill amounts
        await BillModal.bulkWrite(
          billsToIncrement.map(({ invoiceId, amount, allocationId }) => ({
            updateOne: {
              filter: {
                _id: new Types.ObjectId(invoiceId),
                companyId: new Types.ObjectId(companyId),
              },
              update: {
                $inc: {
                  "recievedPaymentAmount.$[elem].amount": amount,
                },
                //  Always keep latest payment date
                $max: {
                  lastPaymentDate: reqBody.paymentDate,
                },
              },
              arrayFilters: [{ "elem.PaymentAllocateId": allocationId }],
            },
          })),
          { session },
        );

        billsToIncrement.forEach((b) => affectedBillIds.add(b.invoiceId));
      }

      // Create new allocations
      if (billsToCreate.length > 0) {
        const newAllocations = billsToCreate.map(({ invoiceId, amount }) => ({
          paymentId: new mongoose.Types.ObjectId(id),
          billId: new mongoose.Types.ObjectId(invoiceId),
          companyId,
          amount,
          createdBy: userId,
          updatedBy: userId,
          PaymentType: PaymentType.bill,
        }));

        const allocationIds = await this.createAllocations(
          newAllocations,
          session,
        );

        // Add new allocations to bills
        await BillModal.bulkWrite(
          billsToCreate.map(({ invoiceId }, index) => ({
            updateOne: {
              filter: {
                _id: new mongoose.Types.ObjectId(invoiceId),
                companyId,
              },
              update: {
                $push: {
                  recievedPaymentAmount: {
                    recievedPaymentId: id,
                    PaymentAllocateId: allocationIds[index]["id"],
                    amount: allocationIds[index]["amount"],
                  },
                } as any,
                //  Always keep latest payment date
                $max: {
                  lastPaymentDate: reqBody.paymentDate,
                },
              },
            },
          })),
          { session },
        );

        billsToCreate.forEach((b) => affectedBillIds.add(b.invoiceId));
      }
    }

    // 4. Get all current bill IDs for this payment
    const currentAllocations = await PaymentAllocationModel.find(
      {
        paymentId: new mongoose.Types.ObjectId(id),
        companyId,
        PaymentType: PaymentType.bill,
      },
      { billId: 1 },
      { session },
    );

    // 5. Update the main Payment document
    const payment = await PaymentModal.findOne(
      { _id: new mongoose.Types.ObjectId(id), companyId },
    ).session(session)

    if (payment) {
      payment.billids = currentAllocations.map((a) => a.billId) as Types.ObjectId[];
      Object.assign(payment, reqBody);
      await payment.save({ session });
    }

    // 6. Record ledger for payment
    await ledgerAdapter.recordLedgerById({
      id: req.params.id as unknown as Types.ObjectId,
      session: session,
      type: TransactionType.PAYMENT,
      companyId: new mongoose.Types.ObjectId(res.locals.companyId),
    });

    // 7. Record ledger for all affected bills in parallel
    if (affectedBillIds.size > 0) {
      await Promise.all(
        Array.from(affectedBillIds).map((billId) =>
          ledgerAdapter.recordLedgerById({
            id: new mongoose.Types.ObjectId(billId),
            session: session,
            type: TransactionType.BILL,
            companyId: new mongoose.Types.ObjectId(res.locals.companyId),
          }),
        ),
      );
    }
   
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing or custom instantiation
export default PaymentService;

export const updateBillPayment =
  paymentService.updateBillPayment.bind(paymentService);
