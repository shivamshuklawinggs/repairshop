import { PipelineStage, Types } from "mongoose";
import { Response } from "express";
import { ProfitAndLossTypeIds } from "shared/pipelines/enum";
import {  subtract, wrap } from "utils/Caluculation";

type ExpensePipeline = PipelineStage[];

export const expensePipeline = ({
  res,
  matchStage = {},
}: {
  res: Response;
  matchStage: Record<string, any>;
}): ExpensePipeline => {
  const companyId = new Types.ObjectId(res.locals.companyId);

  return [
    {
      $match: {
        companyId,
        typeId: {
          $in: [
            ProfitAndLossTypeIds.expense,
            ProfitAndLossTypeIds.otherExpense,
          ],
        },
      },
    },

    {
      $lookup: {
        from: "ledgertransactions",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              ...matchStage,
              companyId,
              $expr: {
                $eq: ["$accountId", "$$accountId"],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalCredit: { $sum: "$credit" },
              totalDebit: { $sum: "$debit" },
            },
          },
          {
            $project: {
              _id: 0,
              totalCredit: 1,
              totalDebit: 1,
            },
          },
        ],
        as: "payments",
      },
    },
    {
      $match: {
        "payments.0": { $exists: true } 
      },
    },

    {
      $addFields: {
        totalAmount: subtract(
        wrap({ $arrayElemAt: ["$payments.totalDebit",0]}),
        wrap({ $arrayElemAt: ["$payments.totalCredit",0]}),
        ),
      },
    },
    {
        $unset:["payments"]
    },

    {
      $facet: {
        expenseData: [
          {
            $project: {
              _id: 1,
              name: 1,
              totalAmount: 1,
            },
          },
        ],

        expenseTotal: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1,
              endingBalance:1
            },
          },
        ],
      },
    },

    {
      $project: {
        _id: 0,
        expenseData: 1,
        expenseTotal: {
          $ifNull: [
            { $arrayElemAt: ["$expenseTotal.totalAmount", 0] },
            0,
          ],
        },
        expenseTotalString: {
          $ifNull: [
            { $arrayElemAt: ["$expenseTotal.totalAmountString", 0] },
            "0",
          ],
        },
        endingBalance: {
          $ifNull: [
            { $arrayElemAt: ["$expenseTotal.endingBalance", 0] },
            "0",
          ],
        },

      },
    },
  ];
};