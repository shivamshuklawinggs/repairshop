import { PipelineStage } from "mongoose";
export const  ReminderPaymentStatusList = ["overdue" , "before_due"]  as const
export type ReminderPaymentStatus =typeof ReminderPaymentStatusList[number]
/**
 * Payment Status Types
 * 
 * These represent the different states an invoice/bill can be in based on:
 * - balanceDue: Amount still owed (negative = overpaid, 0 = paid, positive = unpaid)
 * - totalRecieved: Amount actually received
 * - dueDate: When payment was expected
 * 
 * Why this matters:
 * - Helps in filtering invoices for reminders, reporting, and collections
 * - Enables accurate cash flow forecasting
 * - Supports aging reports and overdue tracking
 */
export type PaymentStatus =
  | "paid_late"
  | "paid"
  | "partial_late"
  | "overdue"
  | "partial"
  | "upcoming"
  | "due";

/**
 * MongoDB Match Condition Type
 * Used to type-safe match conditions in aggregation pipelines
 */
type MatchCondition = Record<string, unknown>;

/**
 * Get MongoDB $match stage for filtering by payment status
 * 
 * Why this is used:
 * - Efficiently filter invoices/bills by their payment state without fetching all documents
 * - Used in reports to show specific payment status groups (e.g., overdue invoices)
 * - Used in reminder systems to target invoices needing attention
 * 
 * @param status - The payment status to filter by
 * @returns MongoDB $match pipeline stage
 * 
 * @example Get all overdue invoices
 * ```typescript
 * const pipeline = [
 *   { $match: { companyId: ObjectId('...') } },
 *   getPaymentStatusMatch('late')
 * ];
 * ```
 * 
 * @example Get all partially paid invoices
 * ```typescript
 * const pipeline = [
 *   { $match: { companyId: ObjectId('...') } },
 *   getPaymentStatusMatch('partial')
 * ];
 * ```
 */
type PaymentStatusConfig = {
  aggregationCase: Record<string, unknown>;
  matchCondition: MatchCondition;
};

export const buildPaymentStatusConfig = () => {
  const now =new Date()
  return {
    paid_late: {
      aggregationCase: {
        $and: [
          { $eq: ["$summary.balanceDue", 0] },
          { $gt: ["$lastPaymentDate", "$dueDate"] }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": 0 },
          {
            $expr: {
              $gt: ["$lastPaymentDate", "$dueDate"]
            }
          }
        ]
      }
    },

    paid: {
      aggregationCase: {
        $eq: ["$summary.balanceDue", 0]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": 0 },
          {
            $or: [
              { lastPaymentDate: null },
              { lastPaymentDate: { $exists: false } },
              {
                $expr: {
                  $lte: ["$lastPaymentDate", "$dueDate"]
                }
              }
            ]
          }
        ]
      }
    },

    partial_late: {
      aggregationCase: {
        $and: [
          { $gt: ["$summary.balanceDue", 0] },
          { $gt: ["$summary.totalRecieved", 0] },
          { $lt: ["$dueDate", "$$NOW"] }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": { $gt: 0 } },
          { "summary.totalRecieved": { $gt: 0 } },
          { dueDate: { $lt: now } }
        ]
      }
    },

    overdue: {
      aggregationCase: {
        $and: [
          { $gt: ["$summary.balanceDue", 0] },
          { $eq: ["$summary.totalRecieved", 0] },
          { $lt: ["$dueDate", "$$NOW"] }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": { $gt: 0 } },
          { "summary.totalRecieved": 0 },
          { dueDate: { $lt:now} }
        ]
      }
    },

    partial: {
      aggregationCase: {
        $and: [
          { $gt: ["$summary.balanceDue", 0] },
          { $gt: ["$summary.totalRecieved", 0] },
          { $gte: ["$dueDate", "$$NOW"] }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": { $gt: 0 } },
          { "summary.totalRecieved": { $gt: 0 } },
          { dueDate: { $gt:now } }
        ]
      }
    },

    due: {
      aggregationCase: {
        $and: [
          { $gt: ["$summary.balanceDue", 0] },
          { $eq: ["$summary.totalRecieved", 0] },
          {
            $eq: [
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$dueDate"
                }
              },
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$$NOW"
                }
              }
            ]
          }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": { $gt: 0 } },
          { "summary.totalRecieved": 0 },
          {
            dueDate: {
              $gte: now,
              $lte: now
            }
          }
        ]
      }
    },

    upcoming: {
      aggregationCase: {
        $and: [
          { $gt: ["$summary.balanceDue", 0] },
          { $eq: ["$summary.totalRecieved", 0] },
          { $gt: ["$dueDate", "$$NOW"] }
        ]
      },

      matchCondition: {
        $and: [
          { "summary.balanceDue": { $gt: 0 } },
          { "summary.totalRecieved": 0 },
          { dueDate: { $gt: now } }
        ]
      }
    }
  } satisfies Record<PaymentStatus, PaymentStatusConfig>;
};
export const getPaymentStatusMatch = (
  status: PaymentStatus
): MatchCondition => {
  return buildPaymentStatusConfig()[status].matchCondition;
};
export const addPaymentMetaFields = (): PipelineStage.AddFields => {
  const config = buildPaymentStatusConfig();

  return {
    $addFields: {
      paymentStatus: {
        $switch: {
          branches: Object.entries(config).map(([status, value]) => ({
            case: value.aggregationCase,
            then: status
          })),
          default: "due"
        }
      },

      daysLate: {
        $switch: {
          branches: [
            // Fully paid but late
            {
              case: config.paid_late.aggregationCase,
              then: {
                $dateDiff: {
                  startDate: "$dueDate",
                  endDate: "$lastPaymentDate",
                  unit: "day"
                }
              }
            },

            // Partial late
            {
              case: config.partial_late.aggregationCase,
              then: {
                $dateDiff: {
                  startDate: "$dueDate",
                  endDate: "$$NOW",
                  unit: "day"
                }
              }
            },

            // Overdue
            {
              case: config.overdue.aggregationCase,
              then: {
                $dateDiff: {
                  startDate: "$dueDate",
                  endDate: "$$NOW",
                  unit: "day"
                }
              }
            }
          ],

          default: 0
        }
      }
    }
  };
};
export const addvansePayments = (type: "customer" | "vendor"): PipelineStage.Lookup => {
   const isCustomer = type === "customer";
  const LocalField: "customerId" | "vendorId" = isCustomer ? "customerId" : "vendorId"
  return  {
    $lookup: {
      from: "accountspayments",
      localField: LocalField,
      pipeline:[
        {
          $match:{
            credits:{$gt:0}
          }
        },
        {
        $project:{
          _id:1,
          credits:1,
          referenceNo:1,
          settledAmount:1,
          amount:1
        }
      }],
      foreignField: "customerId",
      as: "Advance"
    }
  }
};

