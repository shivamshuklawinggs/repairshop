import { PipelineStage, Types } from "mongoose";
import { Response } from "express";

import {
  balanceSheetsCredit,
  balanceSheetsDebit,
  masterType,
} from "models/AccountType.model";

// =========================================================
// BALANCE SHEET REPORT SERVICE
// =========================================================

const BalanceSheetReportService = ({
  res,
  matchStage = {},
  netProfit = 0,
  
}: {
  res: Response;
  netProfit: number;
  allowedreporttype: "balance-sheet";
  matchStage: Record<string, any>;
}): PipelineStage[] => {
  const companyId = new Types.ObjectId(
    res.locals.companyId
  );

  return [
    // =====================================================
    // MATCH COMPANY
    // =====================================================

    {
      $match: {
        companyId,
      },
    },

    // =====================================================
    // LEDGER TRANSACTIONS
    // =====================================================

    {
      $lookup: {
        from: "ledgertransactions",

        localField: "_id",

        foreignField: "accountId",

        pipeline: [
          {
            $match: matchStage,
          },

          {
            $group: {
              _id: null,

              totalCredit: {
                $sum: {
                  $ifNull: ["$credit", 0],
                },
              },

              totalDebit: {
                $sum: {
                  $ifNull: ["$debit", 0],
                },
              },
            },
          },
        ],

        as: "payments",
      },
    },

    // =====================================================
    // EXTRACT TOTALS
    // =====================================================

    {
      $addFields: {
        totalCredits: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$payments.totalCredit",
                0,
              ],
            },
            0,
          ],
        },

        totalDebits: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$payments.totalDebit",
                0,
              ],
            },
            0,
          ],
        },
      },
    },

    // =====================================================
    // DETERMINE NORMAL BALANCE SIDE
    // =====================================================

    {
      $addFields: {
        normalBalanceSide: {
          $switch: {
            branches: [
              {
                case: {
                  $in: [
                    "$detailTypeData.type",
                    balanceSheetsDebit,
                  ],
                },

                then: "debit",
              },

              {
                case: {
                  $in: [
                    "$detailTypeData.type",
                    balanceSheetsCredit,
                  ],
                },

                then: "credit",
              },
            ],

            default: "debit",
          },
        },
      },
    },

    // =====================================================
    // CALCULATE ENDING BALANCE
    // =====================================================

    {
      $addFields: {
        endingBalance: {
          $round: [
            {
              $cond: [
                {
                  $eq: [
                    "$normalBalanceSide",
                    "debit",
                  ],
                },

                // Assets / Expenses
                {
                  $subtract: [
                    "$totalDebits",
                    "$totalCredits",
                  ],
                },

                // Liabilities / Equity / Income
                {
                  $subtract: [
                    "$totalCredits",
                    "$totalDebits",
                  ],
                },
              ],
            },

            2,
          ],
        },
      },
    },

    // =====================================================
    // DYNAMIC RETAINED EARNINGS
    // =====================================================

    {
      $addFields: {
        endingBalance: {
          $cond: [
            {
              $eq: [
                "$masterType",
                masterType.retainedearnings,
              ],
            },

            {
              $round: [
                {
                  $add: [
                    "$endingBalance",
                    netProfit,
                  ],
                },
                2,
              ],
            },

            "$endingBalance",
          ],
        },

        totalCredits: {
          $cond: [
            {
              $and: [
                {
                  $eq: [
                    "$masterType",
                    masterType.retainedearnings,
                  ],
                },

                {
                  $gt: [netProfit, 0],
                },
              ],
            },

            {
              $add: [
                "$totalCredits",
                netProfit,
              ],
            },

            "$totalCredits",
          ],
        },

        totalDebits: {
          $cond: [
            {
              $and: [
                {
                  $eq: [
                    "$masterType",
                    masterType.retainedearnings,
                  ],
                },

                {
                  $lt: [netProfit, 0],
                },
              ],
            },

            {
              $add: [
                "$totalDebits",
                {
                  $abs: netProfit,
                },
              ],
            },

            "$totalDebits",
          ],
        },
      },
    },

    // =====================================================
    // REMOVE ZERO BALANCE ACCOUNTS
    // =====================================================

    {
      $match: {
        endingBalance: {
          $ne: 0,
        },
      },
    },

    // =====================================================
    // GROUP BY ACCOUNT TYPE
    // =====================================================

    {
      $group: {
        _id: "$accountType",

        name: {
          $first: "$accountTypeData.name",
        },

        type: {
          $first: "$detailTypeData.type",
        },

        typeId: {
          $first: "$detailTypeData.typeId",
        },

        normalBalanceSide: {
          $first: "$normalBalanceSide",
        },

        totalCredits: {
          $sum: "$totalCredits",
        },

        totalDebits: {
          $sum: "$totalDebits",
        },

        endingBalance: {
          $sum: "$endingBalance",
        },

        data: {
          $push: {
            _id: "$_id",

            name: "$name",

            type: "$detailTypeData.type",

            typeId:
              "$detailTypeData.typeId",

            masterType: "$masterType",

            normalBalanceSide:
              "$normalBalanceSide",

            endingBalance:
              "$endingBalance",

            totalCredits:
              "$totalCredits",

            totalDebits:
              "$totalDebits",
          },
        },
      },
    },

    // =====================================================
    // BALANCE SHEET FACETS
    // =====================================================

    {
      $facet: {
        Assets: [
          {
            $match: {
              type: "asset",
            },
          },
        ],

        Liabilities: [
          {
            $match: {
              type: {$in:["liability","equity"]},
            },
          },
        ],
        totals: [
          {
            $group: {
              _id: null,

              TotalAssets: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$type",
                        "asset",
                      ],
                    },

                    "$endingBalance",

                    0,
                  ],
                },
              },

              TotalLiabilities: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$type",
                        "liability",
                      ],
                    },

                    "$endingBalance",

                    0,
                  ],
                },
              },

              TotalEquity: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$type",
                        "equity",
                      ],
                    },

                    "$endingBalance",

                    0,
                  ],
                },
              },

              TotalLiabilitiesAndEquity: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$type",
                        [
                          "liability",
                          "equity",
                        ],
                      ],
                    },

                    "$endingBalance",

                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },

    // =====================================================
    // FORMAT TOTALS
    // =====================================================

    {
      $addFields: {
        totals: {
          $ifNull: [
            {
              $arrayElemAt: [
                "$totals",
                0,
              ],
            },

            {
              TotalAssets: 0,
              TotalLiabilities: 0,
              TotalEquity: 0,
              TotalLiabilitiesAndEquity: 0,
            },
          ],
        },
      },
    },
  ];
};

export { BalanceSheetReportService };