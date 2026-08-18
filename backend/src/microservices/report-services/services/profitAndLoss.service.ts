import { Response } from "express";
import { PipelineStage, Types } from "mongoose"
import { ProfitAndLossTypeIds } from "../../../shared/pipelines/enum";


const ProfitAndLossReportService = ({
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
    {
      $lookup: {
        from: "ledgertransactions",
        localField: "_id",
        foreignField: "accountId",
        pipeline: [
          {
            $match: matchStage
          },
          {
            $group: {
              _id: null,
              totalCredit: { $sum: "$credit" },
              totalDebit: { $sum: "$debit" },
              totalAmount: { $sum: "$amount" },
            }
          }
        ],
        as: "payments"
      }
    },
    { $unwind: { path: "$payments", preserveNullAndEmptyArrays: false } },
      // Default (non-month) pipeline
  {
    $addFields: {
      totalCredits: "$payments.totalCredit",
      totalDebits: "$payments.totalDebit",
      totalAmount: "$payments.totalAmount",
    }
  },
  {
    $addFields: {
      endingBalance: {
        $round: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 2]
      }
    }
  },
  {
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      accountType: { $first: "$accountType" }, // ✅ preserved for $switch
      accountTypeData: { $first: "$accountTypeData" }, // ✅ preserved for $switch
      endingBalance: { $sum: "$endingBalance" },
      totalAmount: { $sum: "$totalAmount" },
      totalCredits: { $sum: "$totalCredits" },
      totalDebits: { $sum: "$totalDebits" },
    }
  },
  {
    $match: {
      $or: [
        { totalCredits: { $gt: 0 } },
        { totalDebits: { $gt: 0 } },
      ]
    }
  },
  {
    $group: {
      _id: "$accountType",
      name: { $first: "$accountTypeData.name" },
      type: { $first: "$accountTypeData.type" },
      typeId: { $first: "$accountTypeData.typeId" },
      data: { $push: "$$ROOT" },
      totalCredits: { $sum: "$totalCredits" },
      totalDebits: { $sum: "$totalDebits" },
      endingBalance: { $sum: "$endingBalance" },
      totalAmount: { $sum: "$totalAmount" },
    }
  },
    // ✅ Group by accountType — same output shape as before
    // ✅ $facet — unchanged
    {
      $facet: {
        data: [],
        totals: [
          {
            $group: {
              _id: "ProfitAndLoss",
              Income: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.income] }, "$totalAmount", 0] } },
              COGS: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.costOfGoodsSold] }, "$totalAmount", 0] } },
              Expenses: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.expense] }, "$totalAmount", 0] } },
              OtherIncome: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.otherIncome] }, "$totalAmount", 0] } },
              OtherExpense: { $sum: { $cond: [{ $eq: ["$typeId", ProfitAndLossTypeIds.otherExpense] }, "$totalAmount", 0] } },
            }
          },
          {
            $addFields: {
              grossProfit: { $subtract: ["$Income", "$COGS"] },
              netOperatingIncome: { $subtract: [{ $subtract: ["$Income", "$COGS"] }, "$Expenses"] },
              netOtherIncome: { $subtract: ["$OtherIncome", "$OtherExpense"] },
              netProfit: {
                $add: [
                  { $subtract: [{ $subtract: ["$Income", "$COGS"] }, "$Expenses"] },
                  { $subtract: ["$OtherIncome", "$OtherExpense"] }
                ]
              }
            }
          }
        ],
      }
    },

    { $addFields: { totals: { $arrayElemAt: ["$totals", 0] } } },
  ];
};

export { ProfitAndLossReportService };     