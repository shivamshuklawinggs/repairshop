import { Response } from "express";
import { masterType } from "models/AccountType.model";
import ChartOfAccount from "models/chartOfAccounts.model";
import { Types } from "mongoose";
import { netProfitAndLoss } from "./netProfitAndLoss";
import { ExcelField, parseJsonToExcel } from "utils/parseJsonToExcel";

export interface ChartOfAccountExportData {
  id: string;
  name: string;
  accountType: string;
  detailType: string;
  description: string;
  balance: number;
  endingBalance: number;
  isActive: boolean;
}

export const ChartOfAccountsExportService = async (res: Response): Promise<string> => {
  try {
    const companyId = new Types.ObjectId(res.locals.companyId);
    let netProfit = 0;
    const [profitData = { netProfit: 0 }] =
      await ChartOfAccount.aggregate(
        netProfitAndLoss({
          matchStage: {
            companyId,
          },
          res,
        })
      ).limit(1);

    netProfit = profitData.netProfit || 0;
    const accounts = await ChartOfAccount.aggregate([
      {
        $match: {
          companyId: companyId,
        },
      },

      {
        $sort: {
          name: 1,
        },
      },
      {
        $lookup: {
          from: "ledgertransactions",

          localField: "_id",

          foreignField: "accountId",

          pipeline: [
            {
              $group: {
                _id: null,

                totalCredits: {
                  $sum: {
                    $ifNull: [
                      "$credit",
                      0,
                    ],
                  },
                },

                totalDebits: {
                  $sum: {
                    $ifNull: [
                      "$debit",
                      0,
                    ],
                  },
                },
              },
            },
          ],

          as: "ledger",
        },
      },

      {
        $unwind: {
          path: "$ledger",
          preserveNullAndEmptyArrays: true,
        },
      },

      // =========================================
      // NORMALIZE VALUES
      // =========================================

      {
        $set: {
          totalCredits: {
            $ifNull: [
              "$ledger.totalCredits",
              0,
            ],
          },

          totalDebits: {
            $ifNull: [
              "$ledger.totalDebits",
              0,
            ],
          },
        },
      },

      // =========================================
      // RETAINED EARNINGS
      // =========================================

      {
        $set: {
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

      // =========================================
      // BALANCE
      // =========================================

      {
        $set: {
          endingBalanceNumeric: {
            $round: [
              {
                $subtract: [
                  "$totalDebits",
                  "$totalCredits",
                ],
              },
              2,
            ],
          },
        },
      },

      {
        $set: {
          endingBalance: {
            $concat: [
              {
                $toString: {
                  $abs:
                    "$endingBalanceNumeric",
                },
              },

              " ",

              {
                $cond: [
                  {
                    $lt: [
                      "$endingBalanceNumeric",
                      0,
                    ],
                  },

                  "Cr",

                  "Dr",
                ],
              },
            ],
          },
          accountType:"$accountTypeData.name",
          detailType:"$detailTypeData.name",
        },


      },

      {
        $unset: "ledger",
      },
    ])

    const fields:ExcelField[] = [
      { value: 'name', label: 'Name' },
      { value: 'accountType', label: 'Account Type' },
      { value: 'detailType', label: 'Detail Type' },
      { value: 'endingBalance', label: 'Ending Balance',alignment:"center" },
    ];

    const csvData = await parseJsonToExcel(accounts, fields);
    return csvData;
  } catch (error: any) {
    throw new Error(`Failed to export chart of accounts: ${error.message}`);
  }
};
