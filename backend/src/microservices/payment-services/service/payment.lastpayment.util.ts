import { ClientSession, Types } from "mongoose";
import PaymentModal from "models/payment.model";

/**
 * Recomputes lastPaymentDate for a set of Invoice or Bill documents
 * by reading remaining recievedPaymentAmount entries within the transaction.
 * 
 * Use this after a $pull to replace the $merge aggregate pattern,
 * which is not allowed inside MongoDB transactions.
 */
export async function recomputeLastPaymentDate(
  Model: any,
  docIds: (Types.ObjectId | undefined | null)[],
  companyId: any,
  session: ClientSession
): Promise<void> {
  const ids = docIds.filter((id): id is Types.ObjectId => !!id);
  if (!ids.length) return;

  const docs = await Model.find(
    { _id: { $in: ids }, companyId },
    { recievedPaymentAmount: 1 },
    { session }
  ).lean() as { _id: Types.ObjectId; recievedPaymentAmount?: { recievedPaymentId: Types.ObjectId }[] }[];

  const paymentIds = [
    ...new Set(
      docs.flatMap((d: any) =>
        (d.recievedPaymentAmount ?? [])
          .map((r: any) => r.recievedPaymentId?.toString())
          .filter(Boolean)
      )
    )
  ];

  const dateMap = new Map<string, Date>();
  if (paymentIds.length) {
    const payments = await PaymentModal.find(
      { _id: { $in: paymentIds } },
      { paymentDate: 1 },
      { session }
    ).lean<{ _id: Types.ObjectId; paymentDate: Date }[]>();
    payments.forEach(p => dateMap.set(p._id.toString(), p.paymentDate));
  }

  await Model.bulkWrite(
    docs.map((doc: any) => {
      const dates = (doc.recievedPaymentAmount ?? [])
        .map((r: any) => dateMap.get(r.recievedPaymentId?.toString()))
        .filter((d: any): d is Date => !!d);
      const maxDate = dates.length
        ? new Date(Math.max(...dates.map((d: Date) => new Date(d).getTime())))
        : null;
      return {
        updateOne: {
          filter: { _id: doc._id, companyId },
          update: { $set: { lastPaymentDate: maxDate } }
        }
      };
    }),
    { session }
  );
}
