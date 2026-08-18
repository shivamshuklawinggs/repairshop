import { PipelineStage, Types } from "mongoose"
import { Response } from "express";
const TrialBalanceReportService = ({ res, matchStage = {} }: { res: Response, matchStage: Record<string, any> }): PipelineStage[] => {
    return [
        {
            $match: {
                companyId: new Types.ObjectId(res.locals.companyId), ...matchStage, 
                $or: [ { credit: { $gt: 0 } }, { debit: { $gt: 0 } }, ]
            }
        },
        {
            $group: {
                _id: "$accountId",
                totalCredits: { $sum: "$credit" },
                totalDebits: { $sum: "$debit" },
                totalAmount: { $sum: "$amount" },
            }
        },
        {
            $addFields: {
                endingBalance: {
                    $round: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 2],
                },
            },
        },
        {
            $facet: {
                result: [
                    {
                        $lookup:{
                            from:"chartofaccounts",
                            localField:"_id",
                            foreignField:"_id",
                            pipeline:[
                                {
                                    $project:{
                                        name:1,
                                        _id:0
                                    }
                                }
                            ],
                            as:"accountDetails"
                        }
                    },
                    {
                        $addFields:{
                            name:{
                                $arrayElemAt:["$accountDetails.name",0]
                            }
                        }
                    },
                    {
                        $unset:["accountDetails"]
                    }
                ],
                totals: [
                    {
                        $group: {
                            _id: null,
                            totalCredits: { $sum: "$totalCredits" },
                            totalDebits: { $sum: "$totalDebits" },
                            endingBalance: {
                                $sum: "$endingBalance"
                            },
                            totalAmount: {
                                $sum: "$totalAmount"
                            }

                        }
                    }
                ]
            }
        },
        {
            // flatten totals array
            $project: {
                result:1,
                totals: { $arrayElemAt: ["$totals", 0] }
            }
        }
    ]
}

export { TrialBalanceReportService }