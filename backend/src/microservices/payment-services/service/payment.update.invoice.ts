import mongoose, { Types, ClientSession, Document } from "mongoose";
import PaymentModal, { PaymentType } from "models/payment.model";
import { Response, Request } from "express";
import PaymentAllocationModel, {
  IPaymentAllocation,
} from "models/PaymentAllocation.model";
import InvoiceModal from "models/Invoice.model";
import { UpdateRecievedPamentSchemaType } from "../payment.validate";
import { ledgerAdapter, TransactionType } from "models/Ledger.model";
import { recomputeLastPaymentDate } from "./payment.lastpayment.util";
import { producers } from "config/bullmq";
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
   * Update invoice payment allocations
   *
   * @description Updates existing payment allocations by:
   * 1. Handle payload.deletedPayments - permanently delete allocations and remove from invoices
   * 2. Update existing allocations (from recievedPayments) in place
   * 3. Create new allocations (from payload.invoicePayments)
   * 4. Update invoice summaries and payment document
   */
  public async updateInvoicePayment({
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
    const affectedInvoiceIds = new Set<string>();

    // 1. Handle deletedPayments - permanently delete
    if (payload.deletedPayments && payload.deletedPayments.length > 0) {
      const deletedAllocationIds = payload.deletedPayments.map(
        (p) => new mongoose.Types.ObjectId(p.PaymentAllocateId),
      );

      const allocationsToDelete = await PaymentAllocationModel.find(
        { _id: { $in: deletedAllocationIds }, companyId },
        { _id: 1, invoiceId: 1 },
        { session },
      );

      allocationsToDelete.forEach((a) => {
        if (a.invoiceId) affectedInvoiceIds.add(a.invoiceId.toString());
      });

      // Batch update invoices using bulkWrite
      if (allocationsToDelete.length > 0) {
        await InvoiceModal.bulkWrite(
          allocationsToDelete.map((allocation) => ({
            updateOne: {
              filter: {
                _id: allocation.invoiceId as Types.ObjectId,
                companyId,
              },
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
          InvoiceModal,
          allocationsToDelete.map((a) => a.invoiceId),
          companyId,
          session,
        );
      }
    }

    // 2. Update existing allocations (recievedPayments) in place
    if (payload.recievedPayments && payload.recievedPayments.length > 0) {
      const recievedPayments = payload.recievedPayments;

      recievedPayments.forEach((p) =>
        affectedInvoiceIds.add(p.invoiceId.toString()),
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

      // Batch update invoice payment amounts
      await InvoiceModal.bulkWrite(
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
          invoiceId: {
            $in: payload.invoicePayments.map(
              (p) => new mongoose.Types.ObjectId(p.invoiceId),
            ),
          },
          companyId,
        },
        { invoiceId: 1, amount: 1 },
        { session },
      );

      const existingInvoiceMap = new Map(
        existingAllocations.map((a) => [a.invoiceId!.toString(), a]),
      );

      const invoicesToIncrement: Array<{
        invoiceId: string;
        amount: number;
        allocationId: Types.ObjectId;
      }> = [];
      const invoicesToCreate: Array<{ invoiceId: string; amount: number }> = [];

      // Separate invoices into increment vs create
      payload.invoicePayments.forEach(({ invoiceId, amount }) => {
        const existing = existingInvoiceMap.get(invoiceId.toString());
        if (existing) {
          invoicesToIncrement.push({
            invoiceId: invoiceId.toString(),
            amount,
            allocationId: existing._id,
          });
        } else {
          invoicesToCreate.push({ invoiceId: invoiceId.toString(), amount });
        }
      });

      // Increment existing allocations
      if (invoicesToIncrement.length > 0) {
        await PaymentAllocationModel.bulkWrite(
          invoicesToIncrement.map(({ allocationId, amount }) => ({
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

        // Update invoice amounts
        await InvoiceModal.bulkWrite(
          invoicesToIncrement.map(({ invoiceId, amount, allocationId }) => ({
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

        invoicesToIncrement.forEach((i) => affectedInvoiceIds.add(i.invoiceId));
      }

      // Create new allocations
      if (invoicesToCreate.length > 0) {
        const newAllocations = invoicesToCreate.map(
          ({ invoiceId, amount }) => ({
            paymentId: new mongoose.Types.ObjectId(id),
            invoiceId: new mongoose.Types.ObjectId(invoiceId),
            companyId,
            amount,
            createdBy: userId,
            updatedBy: userId,
            PaymentType: PaymentType.invoice,
          }),
        );

        const allocationIds = await this.createAllocations(
          newAllocations,
          session,
        );

        // Add new allocations to invoices
        await InvoiceModal.bulkWrite(
          invoicesToCreate.map(({ invoiceId }, index) => ({
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

        invoicesToCreate.forEach((i) => affectedInvoiceIds.add(i.invoiceId));
      }
    }

    // 4. Get all current invoice IDs for this payment
    const currentAllocations = await PaymentAllocationModel.find(
      {
        paymentId: new mongoose.Types.ObjectId(id),
        companyId,
        PaymentType: PaymentType.invoice,
      },
      { invoiceId: 1 },
      { session },
    );


    const payment = await PaymentModal.findOne(
      { _id: new mongoose.Types.ObjectId(id), companyId },
    ).session(session)

    if (payment) {
      payment.invoiceIds = currentAllocations.map((a) => a.invoiceId) as Types.ObjectId[];
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

    // 7. Record ledger for all affected invoices in parallel
    if (affectedInvoiceIds.size > 0) {
      await Promise.all(
        Array.from(affectedInvoiceIds).map((invoiceId) =>
          ledgerAdapter.recordLedgerById({
            id: new mongoose.Types.ObjectId(invoiceId),
            session: session,
            type: TransactionType.INVOICE,
            companyId: new mongoose.Types.ObjectId(res.locals.companyId),
          }),
        ),
      );
    }
    if (payment && payment.PaymentType === PaymentType.invoice) {
      producers.rating.customerRated(
        {
          customerId: payment.customerId,
        },
      );
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing or custom instantiation
export default PaymentService;

// Legacy exports for backward compatibility
export const updateInvoicePayment =
  paymentService.updateInvoicePayment.bind(paymentService);
