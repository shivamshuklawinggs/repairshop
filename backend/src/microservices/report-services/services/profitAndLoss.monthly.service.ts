import { Response } from "express";
import { PipelineStage, Types } from "mongoose"
import { ProfitAndLossTypeIds } from "../../../shared/pipelines/enum";
const ProfitAndLossMonthlyReportService = ({
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
              _id: {
                month: { $month: "$postingDate" },
                year: { $year: "$postingDate" }
              },
              totalCredit: { $sum: "$credit" },
              totalDebit: { $sum: "$debit" },
              totalAmount: { $sum: "$amount" }
            }
          }
        ],
        as: "payments"
      }
    },
    { $unwind: { path: "$payments", preserveNullAndEmptyArrays: false } },

    // 1️⃣ Extract month/year & numeric fields from each payment
    {
      $addFields: {
        totalCredits: "$payments.totalCredit",
        totalDebits: "$payments.totalDebit",
        totalAmount: "$payments.totalAmount",
        month: "$payments._id.month",
        year: "$payments._id.year",
      }
    },

    // 2️⃣ Calculate ending balance per transaction
    {
      $addFields: {
        endingBalance: {
          $round: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 2]
        }
      }
    },

    // 3️⃣ Group per Account + Month + Year
    {
      $group: {
        _id: {
          accountId: "$_id",
          month: "$month",
          year: "$year",
        },
        name: { $first: "$name" },
        accountType: { $first: "$accountType" }, // ✅ preserved for $switch
        accountTypeData: { $first: "$accountTypeData" }, // ✅ preserved for $switch
        endingBalance: { $sum: "$endingBalance" },
        totalAmount: { $sum: "$totalAmount" },
        totalCredits: { $sum: "$totalCredits" },
        totalDebits: { $sum: "$totalDebits" },
      }
    },

    // 4️⃣ Group again per Account → build monthlyTotals array
    {
      $group: {
        _id: "$_id.accountId",
        name: { $first: "$name" },
        accountType: { $first: "$accountType" }, // ✅ preserved for $switch
        accountTypeData: { $first: "$accountTypeData" }, // ✅ preserved for $switch
        monthlyTotals: {
          $push: {
            month: "$_id.month",
            year: "$_id.year",
            endingBalance: "$endingBalance",
            totalAmount: "$totalAmount",
            totalCredits: "$totalCredits",
            totalDebits: "$totalDebits",
          }
        },
        endingBalance: { $sum: "$endingBalance" },
        totalAmount: { $sum: "$totalAmount" },
        totalCredits: { $sum: "$totalCredits" },
        totalDebits: { $sum: "$totalDebits" },
      }
    },

    // 5️⃣ Clean shape
    {
      $project: {
        _id: 1,
        name: 1,
        accountType: 1,
        accountTypeData: 1,
        monthlyTotals: { $ifNull: ["$monthlyTotals", []] },
        endingBalance: 1,
        totalAmount: 1,
        totalCredits: 1,
        totalDebits: 1,
      }
    },

    // 6️⃣ Remove empty accounts
    {
      $match: {
        $or: [
          { totalCredits: { $gt: 0 } },
          { totalDebits: { $gt: 0 } },
        ]
      }
    },
    // 7️⃣ Group by accountType - simplified approach
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
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    // ✅ Group by accountType — same output shape as before
    // ✅ $facet — unchanged
    {
      $facet: {
        data: [
          {
            $addFields: {
              monthlyTotals: {
                $reduce: {
                  input: "$data",
                  initialValue: [],
                  in: {
                    $reduce: {
                      input: "$$this.monthlyTotals",
                      initialValue: "$$value",
                      in: {
                        $cond: {
                          if: {
                            $anyElementTrue: {
                              $map: {
                                input: "$$value",
                                as: "existing",
                                in: {
                                  $and: [
                                    { $eq: ["$$existing.month", "$$this.month"] },
                                    { $eq: ["$$existing.year", "$$this.year"] }
                                  ]
                                }
                              }
                            }
                          },
                          then: {
                            $map: {
                              input: "$$value",
                              as: "existing",
                              in: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $eq: ["$$existing.month", "$$this.month"] },
                                      { $eq: ["$$existing.year", "$$this.year"] }
                                    ]
                                  },
                                  then: {
                                    month: "$$existing.month",
                                    year: "$$existing.year",
                                    totalAmount: { $add: ["$$existing.totalAmount", "$$this.totalAmount"] },
                                    endingBalance: { $add: ["$$existing.endingBalance", "$$this.endingBalance"] },
                                    totalCredits: { $add: ["$$existing.totalCredits", "$$this.totalCredits"] },
                                    totalDebits: { $add: ["$$existing.totalDebits", "$$this.totalDebits"] }
                                  },
                                  else: "$$existing"
                                }
                              }
                            }
                          },
                          else: { $concatArrays: ["$$value", ["$$this"]] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ],
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
        monthlyTotals: [
          { $unwind: { path: "$data", preserveNullAndEmptyArrays: false } },
          { $unwind: { path: "$data.monthlyTotals", preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: { month: "$data.monthlyTotals.month", year: "$data.monthlyTotals.year" },
              Income: { $sum: { $cond: [{ $eq: ["$data.typeId", ProfitAndLossTypeIds.income] }, { $abs: "$data.monthlyTotals.totalAmount" }, 0] } },
              COGS: { $sum: { $cond: [{ $eq: ["$data.typeId", ProfitAndLossTypeIds.costOfGoodsSold] }, { $abs: "$data.monthlyTotals.totalAmount" }, 0] } },
              Expenses: { $sum: { $cond: [{ $eq: ["$data.typeId", ProfitAndLossTypeIds.expense] }, { $abs: "$data.monthlyTotals.totalAmount" }, 0] } },
              OtherIncome: { $sum: { $cond: [{ $eq: ["$data.typeId", ProfitAndLossTypeIds.otherIncome] }, { $abs: "$data.monthlyTotals.totalAmount" }, 0] } },
              OtherExpense: { $sum: { $cond: [{ $eq: ["$data.typeId", ProfitAndLossTypeIds.otherExpense] }, { $abs: "$data.monthlyTotals.totalAmount" }, 0] } },
            }
          },
          {
            $addFields: {
              month: "$_id.month",
              year: "$_id.year",
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
          },
          {
            $project: {
              _id: 0, month: 1, year: 1,
              Income: 1, COGS: 1, Expenses: 1, OtherIncome: 1, OtherExpense: 1,
              grossProfit: 1, netOperatingIncome: 1, netOtherIncome: 1, netProfit: 1,
            }
          },
          { $sort: { year: 1, month: 1 } }
        ]
      }
    },

    { $addFields: { totals: { $arrayElemAt: ["$totals", 0] } } },
  ];
};

export { ProfitAndLossMonthlyReportService };     