import { PipelineStage, Types } from "mongoose";
import { Response } from "express";

const GeneralLedgerReportService = ({
  res,
  matchStage = {},
  paymentsLimit = 5,
  paymentsPage = 1,
}: {
  res: Response;
  matchStage: Record<string, any>;
  paymentsLimit?: number;
  paymentsPage?: number;
  accountId?:string
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(res.locals.companyId);
  const paymentsskip = (paymentsPage - 1) * paymentsLimit;

  return [
    // ✅ Filter early
    { $match: { companyId } },

    {
      $lookup: {
        from: "ledgertransactions",
        let: { accountId: "$_id" },
        pipeline: [
          {
            // ✅ combine lookup match + external match
            $match: {
              $expr: { $eq: ["$accountId", "$$accountId"] },
              ...matchStage
            }
          },

          // ✅ sort by date descending to get recent transactions first
          {
            $sort: { postingDate: -1 }
          },

          // ✅ facet to get accurate totals + limited data
          {
            $facet: {
              // Branch 1: Calculate totals on ALL documents
              totals: [
                {
                  $group: {
                    _id: null,
                    totalCredit: { $sum: "$credit" },
                    totalDebit: { $sum: "$debit" },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                  }
                }
              ],
              // Branch 2: Get limited data array
              data: [
                {
                  $skip:paymentsskip
                },
                { $limit: paymentsLimit },
                {
                  $project: {
                    date: {
                      $dateToString: {
                        format: "%m-%d-%Y",
                        date: "$postingDate"
                      }
                    },
                    id: "$referenceId",
                    _id:"$referenceId",
                    type: "$type",
                    debit: "$debit",
                    credit: "$credit",
                    amount: "$amount"
                  }
                }
              ]
            }
          },

          // ✅ merge facet results
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  { $arrayElemAt: ["$totals", 0] },
                  { data: "$data" }
                ]
              }
            }
          }
        ],
        as: "transactions"
      }
    },

    // ✅ avoid unwind by using first element
    {
      $addFields: {
        transaction: { $arrayElemAt: ["$transactions", 0] }
      }
    },

    // ✅ default values + calculations in ONE stage
    {
      $addFields: {
        totalCredits: { $ifNull: ["$transaction.totalCredit", 0] },
        totalDebits: { $ifNull: ["$transaction.totalDebit", 0] },
        totalAmount: { $ifNull: ["$transaction.totalAmount", 0] },
        totalTransactions: { $ifNull: ["$transaction.total", 0] },
        transactions: { $ifNull: ["$transaction.data", []] },
        endingBalance: {
          $round: [
            {
              $subtract: [
                { $ifNull: ["$transaction.totalDebit", 0] },
                { $ifNull: ["$transaction.totalCredit", 0] }
              ]
            },
            2
          ]
        }
      }
    },

    // ✅ filter early (important)
    {
      $match: {
        $or: [
          { totalCredits: { $gt: 0 } },
          { totalDebits: { $gt: 0 } }
        ]
      }
    },

    // ✅ clean projection (remove unnecessary $sum)
    {
      $project: {
        name: 1,
        payments:"$transactions",
        totalCredits: 1,
        totalDebits: 1,
        totalAmount: 1,
        endingBalance: 1
      }
    },

    // ✅ final totals with pagination
    {
      $facet: {
        result: [ ],
        totals: [
          {
            $group: {
              _id: null,
              totalCredits: { $sum: "$totalCredits" },
              totalDebits: { $sum: "$totalDebits" },
              totalAmount: { $sum: "$totalAmount" },
              endingBalance: { $sum: "$endingBalance" }
            }
          }
        ],
        count: [{ $count: "total" }]
      }
    },

    {
      $addFields: {
        totals: { $arrayElemAt: ["$totals", 0] },
        count: { $arrayElemAt: ["$count", 0] }
      }
    }
  ];
};

export { GeneralLedgerReportService };