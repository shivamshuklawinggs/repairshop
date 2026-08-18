import { PipelineStage } from "mongoose"
import pagination from "utils/pagination";
import { masterType } from 'models/AccountType.model';;
import { customerPipeLine } from "shared/pipelines/BaseLookups/BasePipelines";
import { getAgingBuckets } from "helpers/aging.bucket.utils";

const AcRecievePayableSummaryReportService = ({
  allowedreporttype,
  page,
  limit,
  end
}: {
  allowedreporttype: "AccountsReceiveable" | "AccountsPayable";
  page: number;
  limit: number;
  end:Date
}): PipelineStage[] => {
// 👇 THIS is your "now"
const referenceDate = end 
const date30 = new Date(referenceDate);
date30.setDate(referenceDate.getDate() - 30);

const date60 = new Date(referenceDate);
date60.setDate(referenceDate.getDate() - 60);

const date90 = new Date(referenceDate);
date90.setDate(referenceDate.getDate() - 90);
  // ✅ reusable buckets
  const bucketFields = getAgingBuckets(referenceDate, date30, date60, date90);
const isPayable = allowedreporttype === "AccountsPayable";

  return [

    {
      $facet: {
        data: [
          {
            $group: {
              _id: isPayable ? "$vendorId" : "$customerId",
              ...(isPayable
                ? { vendorId: { $first: "$vendorId" } }
                : { customerId: { $first: "$customerId" } }),
              totalDueAmount: { $sum: "$balanceDue" },
              totalsettleAmount: { $sum: "$settledAmount" },
              totalAmount: { $sum: "$amount" },

              // ✅ Buckets using postingDate (FAST)
              ...bucketFields, // ✅ reused

            },
          },

          // ✅ sort AFTER grouping (much cheaper)
          {
            $addFields: {
              maxBucketAmount: {
                $max: [
                  "$due_0_30",
                  "$due_31_60",
                  "$due_61_90",
                  "$due_90_plus",
                ],
              },
            },
          },
          { $sort: { maxBucketAmount: -1 } },

          ...pagination(page, limit) as any,

          ...customerPipeLine(
            allowedreporttype === "AccountsPayable"
              ? masterType.vendor
              : masterType.customer
          ),
        ],

        total: [{ $count: "total" }],

        totalData: [
          {
            $group: {
              _id: null,
              totalDueAmount: { $sum: "$balanceDue" },
              totalsettleAmount: { $sum: "$settledAmount" },
              totalAmount: { $sum: "$amount" },
               ...bucketFields, // ✅ reused
            },
          },
        ],
      },
    },

    {
      $project: {
        data: 1,
        total: { $ifNull: [{ $arrayElemAt: ["$total.total", 0] }, 0] },
        totalData: {
          $ifNull: [
            { $arrayElemAt: ["$totalData", 0] },
            {
              totalDueAmount: 0,
              totalsettleAmount: 0,
              totalAmount:0,
              due_0_30: 0,
              due_31_60: 0,
              due_61_90: 0,
              due_90_plus: 0,
            },
          ],
        },
      },
    },
  ];
};

export { AcRecievePayableSummaryReportService }