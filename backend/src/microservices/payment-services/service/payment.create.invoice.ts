import { Types, ClientSession, Document } from "mongoose";
import { IPayment, PaymentType } from "models/payment.model";
import { Response, Request } from "express";
import PaymentAllocationModel , { IPaymentAllocation } from "models/PaymentAllocation.model";
import InvoiceModal from "models/Invoice.model";
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
    allocations: Omit<IPaymentAllocation,keyof Document>[],
    session: ClientSession
  ): Promise<{id:Types.ObjectId,amount:number}[]> {
    const allocationIds: {id:Types.ObjectId,amount:number}[] = [];
    
    for (const allocation of allocations) {
      const [created] = await PaymentAllocationModel.create([allocation], { session });
      allocationIds.push({id:created._id,amount:created.amount});
    }
    
    return allocationIds;
  }
  /**
   * Create invoice payment allocations with proper tracking
   * 
   * @description Creates PaymentAllocation records and updates invoice summaries
   * with received amounts. Maintains audit trail of all payment applications.
   */
  public async createInvoicePayment({
    invoicePayments,
    session,
    payment,
    req,
    res
  }: {
    invoicePayments: { invoiceId: Types.ObjectId; amount: number }[];
    session: ClientSession;
    req: Request;
    payment: IPayment;
    res: Response;
  }): Promise<Types.ObjectId[]> {
    const userId = req.user?._id!;
    const companyId = res.locals.companyId as unknown as Types.ObjectId;
    
    const invoiceIds = invoicePayments?.map((p) => p.invoiceId);
    if(!invoiceIds || !invoiceIds.length) return []
    // Create payment allocation records
    const allocations = invoicePayments?.map(({ invoiceId, amount }) => ({
      paymentId: payment._id,
      invoiceId,
      companyId,
      amount,
      createdBy: userId,
      updatedBy: userId,
      PaymentType: PaymentType.invoice
    }));

    const allocationIds = await this.createAllocations(allocations, session);
    
    // Batch update invoices with new allocations using bulkWrite
    await InvoiceModal.bulkWrite(
      invoicePayments?.map(({ invoiceId }, index) => ({
        updateOne: {
          filter: { _id: invoiceId, companyId },
          update: {
            $push: {
              recievedPaymentAmount: {
                recievedPaymentId: payment._id,
                PaymentAllocateId: allocationIds[index]["id"],
                amount: allocationIds[index]["amount"]
              }
            } as any,
             //  Always keep latest payment date
            $max: {
              lastPaymentDate: payment.paymentDate
            }
          }
        }
      })),
      { session }
    );

    return invoiceIds;
  }

 

}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing or custom instantiation
export default PaymentService;

export const createInvoicePayment = paymentService.createInvoicePayment.bind(paymentService);