import { Response } from "express";
import { PipelineStage, Types } from "mongoose";
import { ProfitAndLossTypeIds } from "shared/pipelines/enum";

const netProfitAndLoss = ({
  res,
  matchStage = {},
}: {
  res: Response;
  matchStage: Record<string, any>;
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(res.locals.companyId);

  return [
    // ✅ Run directly on ChartOfAccounts model
    { $match: { companyId } },

    // ✅ Only lookup ledgertransactions — no chartofaccounts lookup
    {
      $lookup: {
        from: "ledgertransactions",
        localField: "_id",
        foreignField: "accountId",
        pipeline: [
          { $match: matchStage },
          {
            $group: {
              _id:         null,
              totalAmount: { $sum: "$amount" },
            }
          }
        ],
        as: "payments"
      }
    },

    {
      $addFields: {
        totalAmount: { $ifNull: [{ $arrayElemAt: ["$payments.totalAmount", 0] }, 0] },
      }
    },

    // ✅ Filter early — drop zero-amount accounts
    { $match: { totalAmount: { $gt: 0 } } },

    // ✅ Single group pass — same logic as before
    {
      $group: {
        _id:          "ProfitAndLoss",
        Income:       { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.income]          }, "$totalAmount", 0] } },
        COGS:         { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.costOfGoodsSold] }, "$totalAmount", 0] } },
        Expenses:     { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.expense]         }, "$totalAmount", 0] } },
        OtherIncome:  { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.otherIncome]     }, "$totalAmount", 0] } },
        OtherExpense: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.otherExpense]    }, "$totalAmount", 0] } },
      }
    },

    {
      $project: {
        netProfit: {
          $add: [
            { $subtract: [{ $subtract: ["$Income", "$COGS"] }, "$Expenses"] },
            { $subtract: ["$OtherIncome", "$OtherExpense"] }
          ]
        }
      }
    },

    {
      $group: {
        _id:       "retained_earnings",
        netProfit: { $sum: "$netProfit" }
      }
    }
  ];
};

export { netProfitAndLoss };  