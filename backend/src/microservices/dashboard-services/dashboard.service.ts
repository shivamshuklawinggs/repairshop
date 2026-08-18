import { PipelineStage, Types } from "mongoose";
import { Response } from "express";
import { BalanceSheetTypeIds, ProfitAndLossTypeIds } from "shared/pipelines/enum";
import { profitAndLoss } from "models/AccountType.model";
import { pipelineTypes } from "types/pipelineTypes";
import {  subtract } from "utils/Caluculation";
const AgingPiepline = ({ matchStage = {}, field = "AccountsReceivable", companyId }: { matchStage: Record<string, any>, field: "AccountsReceivable" | "AccountsPayable", companyId: Types.ObjectId }): pipelineTypes => {

  return [
    {
      $lookup: {
        from: "ledgertransactions",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              ...matchStage,
              companyId: companyId,
              $expr: {
                $eq: ["$accountId", "$$accountId"],
              },

            }
          },
          {
            $addFields: {
              ageInMonths: {
                $max: [
                  0,
                  {
                    $dateDiff: {
                      startDate: "$postingDate",
                      endDate: "$$NOW",
                      unit: "month"
                    }
                  }
                ]
              }
            }
          },
          
          {
            $group: {
              _id: null,
              currentMonth: {
                $sum: {
                  $cond: [
                    { $eq: ["$ageInMonths", 0] },
                    subtract("$debit","$credit"),
                    0
                  ]
                }
              },
              oneMonth: {
                $sum: {
                  $cond: [
                    { $eq: ["$ageInMonths", 1] },
                    subtract("$debit","$credit"),
                    0
                  ]
                }
              },

              twoToSixMonths: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: ["$ageInMonths", 2]
                        },
                        {
                          $lte: ["$ageInMonths", 6]
                        }
                      ]
                    },
                    subtract("$debit","$credit"),
                    0
                  ]
                }
              },

              greaterThanSixMonths: {
                $sum: {
                  $cond: [
                    { $gt: ["$ageInMonths", 6] },
                    subtract("$debit","$credit"),
                    0
                  ]
                }
              },
              totalAmount: {
                $sum: subtract("$debit","$credit")
              },
            }
          },
        ],
        as: "results"
      }
    },
    {
      $match: {
        "results.0": { $exists: true }
      }
    },
    {
      $addFields: {
        currentMonth: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$results.currentMonth",
                0
              ]
            },
            0
          ]
        },
        oneMonth: {
          $ifNull: [
            {
              $arrayElemAt: ["$results.oneMonth", 0]
            },
            0
          ]
        },
        twoToSixMonths: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$results.twoToSixMonths",
                0
              ]
            },
            0
          ]
        },
        greaterThanSixMonths: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$results.greaterThanSixMonths",
                0
              ]
            },
            0
          ]
        },
        totalAmount: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$results.totalAmount",
                0
              ]
            },
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: field,
        currentMonth: { $sum: "$currentMonth" },
        oneMonth: { $sum: "$oneMonth" },
        twoToSixMonths: { $sum: "$twoToSixMonths" },
        greaterThanSixMonths: { $sum: "$greaterThanSixMonths" },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $project: {
        _id: 0,
        [field]: {
          currentMonth: "$currentMonth",
          oneMonth: "$oneMonth",
          twoToSixMonths: "$twoToSixMonths",
          greaterThanSixMonths: "$greaterThanSixMonths",
          totalAmount: "$totalAmount",
        }
      }
    }
  ]
}

/**
 * ✅ Helper: generate conditional sum
 */
const sumByType = (typeId: ProfitAndLossTypeIds, field: string) => ({
  $sum: {
    $cond: [{ $eq: ["$typeId", typeId] }, field, 0]
  }
});
/**
 * ✅ Helper: calculate profit columns from grouped values
 */
const addProfitFieldsStage: PipelineStage = {
  $addFields: {
    grossProfit: { $subtract: ["$Income", "$COGS"] },
    netOperatingIncome: {
      $subtract: [{ $subtract: ["$Income", "$COGS"] }, "$Expenses"]
    },
    netOtherIncome: { $subtract: ["$OtherIncome", "$OtherExpense"] },
    netProfit: {
      $add: [
        { $subtract: [{ $subtract: ["$Income", "$COGS"] }, "$Expenses"] },
        { $subtract: ["$OtherIncome", "$OtherExpense"] }
      ]
    }
  }
};



const profitAndLossDataPipeline = ({
  res,
  matchStage = {}
}: {
  res: Response;
  matchStage: Record<string, any>;
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(res.locals.companyId)
  return [
    {
      $match: {
        type: { $in: profitAndLoss },
        companyId: companyId
      }
    },

    {
      $lookup: {
        from: "ledgertransactions",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              ...matchStage,
              companyId: companyId,
              $expr: { $eq: ["$accountId", "$$accountId"] },

            }
          },
          {
            $sort: {
              postingDate: 1
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$postingDate" },
                month: { $month: "$postingDate" }
              },
              totalCredit: { $sum: "$credit" },
              totalDebit: { $sum: "$debit" },
              totalAmount: { $sum: "$amount" }
            }
          },
          {
            $addFields: {
              monthName: {
                $dateToString: {
                  format: "%b", // short month (Jan, Feb)
                  date: {
                    $dateFromParts: {
                      year: "$_id.year",
                      month: "$_id.month",
                      day: 1
                    }
                  }
                }
              },
              ageInMonths: {
                $dateDiff: {
                  startDate: {
                    $dateFromParts: {
                      year: "$_id.year",
                      month: "$_id.month",
                      day: 1
                    }
                  },
                  endDate: "$$NOW",
                  unit: "month"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              monthName: 1,
              ageInMonths: 1,
              totalCredit: 1,
              totalDebit: 1,
              totalAmount: 1
            }
          },
          {
            $sort: { year: 1, month: 1 }
          }
        ],
        as: "results"
      }
    },

    //  filter early
    {
      $match: {
        results: { $ne: [] }
      }
    },

    //  flatten
    { $unwind: "$results" },

    {
      $project: {
        _id: 1,
        typeId: 1,
        type: 1,
        masterType: 1,
        month: "$results.month",
        year: "$results.year",
        monthName: "$results.monthName",
        ageInMonths: "$results.ageInMonths",
        totalAmount: "$results.totalAmount"
      }
    },
    {
      $sort: { year: 1, month: 1 }
    },
    {
      $facet: {
        // Profit and loss Data
        ProfitAndLossData: [],
        // Profit and loss Totals
        ProfitAndLossTotals: [
          {
            $group: {
              _id: "ProfitAndLoss",
              Income: sumByType(ProfitAndLossTypeIds.income, "$totalAmount"),
              COGS: sumByType(ProfitAndLossTypeIds.costOfGoodsSold, "$totalAmount"),
              Expenses: sumByType(ProfitAndLossTypeIds.expense, "$totalAmount"),
              OtherIncome: sumByType(ProfitAndLossTypeIds.otherIncome, "$totalAmount"),
              OtherExpense: sumByType(ProfitAndLossTypeIds.otherExpense, "$totalAmount")
            }
          },
          addProfitFieldsStage
        ],
      },
    },
    {
      $project: {
        _id: 0,
        ProfitAndLossData: 1,
        ProfitAndLossTotals: {
          $ifNull: [{ $arrayElemAt: ["$ProfitAndLossTotals", 0] }, {
            "_id": "ProfitAndLoss",
            "Income": 0,
            "COGS": 0,
            "Expenses": 0,
            "OtherIncome": 0,
            "OtherExpense": 0,
            "grossProfit": 0,
            "netOperatingIncome": 0,
            "netOtherIncome": 0,
            "netProfit": 0
          }]
        },
      }
    }

  ];
};


const accountsReceivablePipeline = ({
  res,
  matchStage = {}
}: {
  res: Response;
  matchStage: Record<string, any>;
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(res.locals.companyId)
  return [
    {
      $match: {
        typeId: BalanceSheetTypeIds.AccountsReceivable,
        companyId: companyId
      }
    },
    ...AgingPiepline({ matchStage, field: "AccountsReceivable", companyId }),
  ];
};
const accountsPayablePipeline = ({
  res,
  matchStage = {}
}: {
  res: Response;
  matchStage: Record<string, any>;
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(res.locals.companyId)
  return [
    {
      $match: {
        typeId: BalanceSheetTypeIds.AccountsPayable,
        companyId: companyId
      }
    },
    ...AgingPiepline({ matchStage, field: "AccountsPayable", companyId }),
  ];
};

export { profitAndLossDataPipeline, accountsReceivablePipeline, accountsPayablePipeline }
