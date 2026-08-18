import { PipelineStage, Types } from "mongoose";
import { Response } from "express";
import { ProfitAndLossTypeIds } from "shared/pipelines/enum";
import {  subtract, wrap } from "utils/Caluculation";
type salesDatapipelineStage = Array<
  | PipelineStage.Match
  | PipelineStage.Lookup
  | PipelineStage.Unwind
  | PipelineStage.Project
  | PipelineStage.Facet
  | PipelineStage.Sort
  | PipelineStage.AddFields
  | PipelineStage.Group
  | PipelineStage.ReplaceRoot
>;
export const salesDataPipeline = ({
  res,
  matchStage = {},
}: {
  res: Response;
  matchStage: Record<string, any>;
}): salesDatapipelineStage => {
  const companyId = new Types.ObjectId(res.locals.companyId);
  return [
    {
      $match: {
        typeId: ProfitAndLossTypeIds.income,
        companyId: companyId,
      },
    },
    {
      $group: {
        _id: null,
        accounts: {
          $push: {
            _id: "$_id",
            name: "$name", // or accountName depending on your schema
          },
        },
      },
    },
    {
      $lookup: {
        from: "ledgertransactions",
        let: {
          accountIds: {
            $map: {
              input: "$accounts",
              as: "acc",
              in: "$$acc._id",
            },
          },
          accounts: "$accounts",
        },
        pipeline: [
          {
            $match: {
              ...matchStage,
              companyId: companyId,
              $expr: { $in: ["$accountId", "$$accountIds"] },
            },
          },
          {
            $sort: {
              postingDate: 1,
            },
          },
          {
            $facet: {
              SalesData: [
                {
                  $group: {
                    _id: {
                      year: { $year: "$postingDate" },
                      month: { $month: "$postingDate" },
                      accountId: "$accountId",
                    },
                    totalCredit: { $sum: "$credit" },
                    totalDebit: { $sum: "$debit" },
                    totalAmount: { $sum: "$amount" },
                  },
                },
                {
                  $addFields: {
                    accountName: {
                      $let: {
                        vars: {
                          account: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$$accounts",
                                  as: "acc",
                                  cond: {
                                    $eq: ["$$acc._id", "$_id.accountId"],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: "$$account.name",
                      },
                    },
                    monthName: {
                      $dateToString: {
                        format: "%b", // short month (Jan, Feb)
                        date: {
                          $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: 1,
                          },
                        },
                      },
                    },
                    ageInMonths: {
                      $dateDiff: {
                        startDate: {
                          $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: 1,
                          },
                        },
                        endDate: "$$NOW",
                        unit: "month",
                      },
                    },
                    total: subtract("$totalDebit", "$totalCredit"),
                  },
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
                    totalAmount: 1,
                    accountName:1,
                    total: 1,
                  },
                },
                {
                  $sort: { year: 1, month: 1 },
                },
              ],
              totals: [
                {
                  $group: {
                    _id: null,
                    totalCredit: { $sum: "$credit" },
                    totalDebit: { $sum: "$debit" },
                    totalAmount: { $sum: "$amount" },
                  },
                },
                {
                  $project: {
                    // total: { $subtract: ["$totalDebit", "$totalCredit"] },
                    total: subtract("$totalDebit", "$totalCredit"),
                    _id: 0,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$totals",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              SalesData: 1,
              TotalSales: wrap("$totals.total"),
            },
          },
        ],
        as: "results",
      },
    },

    //  filter early
    {
      $match: {
        results: { $ne: [] },
      },
    },

    //  flatten
    {
      $unwind: {
        preserveNullAndEmptyArrays: true,
        path: "$results",
      },
    },
    {
      $replaceRoot: {
        newRoot: "$results",
      },
    },
    // {
    //   $project: {
    //     SalesData: "$results.monthlyTotals",
    //     TotalSales: {
    //       $ifNull: [{ $arrayElemAt: ["$results.totals.totalAmount", 0] }, 0],
    //     },
    //   },
    // },
    /**
     * ✅ Facet: totals + monthlyTotals
     */
    // {
    //   $facet: {
    //     // Sales Data
    //     SalesData: [],
    //     // Total Sales
    //     TotalSales: [
    //       {
    //         $group: {
    //           _id: "Sales",
    //           totalAmount: { $sum: "$totalAmount" },
    //         },
    //       },
    //     ],
    //   },
    // },
    // {
    //   $project: {
    //     _id: 0,
    //     SalesData: 1,
    //     TotalSales: {
    //       $ifNull: [{ $arrayElemAt: ["$TotalSales.totalAmount", 0] }, 0],
    //     },
    //   },
    // },
  ];
};
