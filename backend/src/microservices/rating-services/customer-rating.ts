import InvoiceModal from "models/Invoice.model";
import { Types } from "mongoose";
import { defaultSummary, PaymentSummaryResult, RatingSummary } from "./constant";
import Customer from "models/Customer.model";

export const paymentSummaryPipeline = async ({ id }: { id: Array<Types.ObjectId> }): Promise<PaymentSummaryResult> => {
  const [data] = await InvoiceModal.aggregate<PaymentSummaryResult>([
    {
      $match: {
        customerId:{$in:id.map((i)=>new Types.ObjectId(i)) }
      }
    },
    // ✅ STEP 1
    {
      $addFields: {
        isPaid: { $lte: ["$summary.balanceDue", 0.01] },

        isUnpaid: {
          $and: [
            { $gt: ["$summary.balanceDue", 0.01] },
            { $eq: ["$summary.totalRecieved", 0] }
          ]
        },

        isPartial: {
          $and: [
            { $gt: ["$summary.balanceDue", 0.01] },
            { $gt: ["$summary.totalRecieved", 0] }
          ]
        },

        isLate: {
          $and: [
            { $ne: ["$lastPaymentDate", null] },
            { $gt: ["$lastPaymentDate", "$dueDate"] }
          ]
        },

        isOnTime: {
          $and: [
            { $ne: ["$lastPaymentDate", null] },
            { $lte: ["$lastPaymentDate", "$dueDate"] }
          ]
        },

        isOverdue: {
          $and: [
            { $gt: ["$summary.balanceDue", 0.01] },
            { $eq: ["$summary.totalRecieved", 0] },
            { $lt: ["$dueDate", "$$NOW"] }
          ]
        },

        isUpcoming: {
          $and: [
            { $gt: ["$summary.balanceDue", 0.01] },
            { $eq: ["$summary.totalRecieved", 0] },
            { $gte: ["$dueDate", "$$NOW"] }
          ]
        }
      }
    },

    // ✅ STEP 2
    {
      $group: {
        _id: null,
        totalPaid: {
          $sum: { $cond: ["$isPaid", 1, 0] }
        },
        totalUnPaid: {
          $sum: { $cond: ["$isUnpaid", 1, 0] }
        },
        onTimePayments: {
          $sum: {
            $cond: [
              { $and: ["$isPaid", "$isOnTime"] },
              1,
              0
            ]
          }
        },
        latePayments: {
          $sum: {
            $cond: [
              { $and: ["$isPaid", "$isLate"] },
              1,
              0
            ]
          }
        },
        partial_late: {
          $sum: {
            $cond: [
              { $and: ["$isPartial", "$isLate"] },
              1,
              0
            ]
          }
        },
        overdue: {
          $sum: { $cond: ["$isOverdue", 1, 0] }
        },
      }
    },

    { $project: { _id: 0 } }
  ]);

  return data ?? defaultSummary;
};

function computePaymentScore(summary: PaymentSummaryResult): number {
  const bad =
    summary.latePayments +
    summary.partial_late +
    summary.overdue;
  
  const ratio = bad / summary.totalPaid;
  return Math.max(0, 100 - ratio * 100);
}


export async function getCustomerRatingSummary(
  customerId: Types.ObjectId
): Promise<RatingSummary> {
  // Customer: use payment score only (no load-based rating)
  const paymentSummary = await paymentSummaryPipeline({ id: [customerId] });
  const paymentScore = computePaymentScore(paymentSummary);

  // Always use payment score only since we're not using loads
  const score = Math.round(paymentScore * 10) / 10;
  return { score: score || 100, stars: Math.round((score / 20) * 10) / 10 || 5 };
}
export async function updateCustomerPlatformRating(
  vinNumber: string
) {
  const [{ autoScore = 0, stars = 0 }] = await Customer.aggregate([
    {
      $match: {
        "truckDetails.vinNumber": vinNumber
      }
    },
    {
      $match: {
        "truckDetails.vinNumber": {
          $exists: true,
          $ne: null,
        },
      },
    },
    {
      $group: {
        _id: null,
        score: { $avg: "$stars" },
        autoScore: { $avg: "$autoScore" },
      }
    }
  ]
  )
  await Customer.updateMany({
    "truckDetails.vinNumber": vinNumber
  }, {
    platformRate: {
      autoScore: autoScore ??50,
      stars: stars ?? 2.5
    }
  })
}
