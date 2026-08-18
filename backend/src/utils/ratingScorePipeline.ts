import { PipelineStage } from "mongoose";
import { multiply } from "./Caluculation";

/**
 * MongoDB helper function to calculate Report Score
 * Formula:
 * reportScore = min(5, max(1, 5 + ((appreciation * 1 + warning * -1 + issue * -2 + complaint * -3) / totalReports)))
 */
export const MongoReportScore = {
  $let: {
    vars: {
      appreciation: { $ifNull: ["$reportStats.appreciation", 0] },
      warning: { $ifNull: ["$reportStats.warning", 0] },
      issue: { $ifNull: ["$reportStats.issue", 0] },
      complaint: { $ifNull: ["$reportStats.complaint", 0] },
      totalReports: {
        $max: [
          1,
          {
            $add: [
              { $ifNull: ["$reportStats.appreciation", 0] },
              { $ifNull: ["$reportStats.warning", 0] },
              { $ifNull: ["$reportStats.issue", 0] },
              { $ifNull: ["$reportStats.complaint", 0] },
            ],
          },
        ],
      },
    },
    in: {
      $let: {
        vars: {
          weightedScore: {
            $divide: [
              {
                $add: [
                  { $multiply: ["$$appreciation", 1] },
                  { $multiply: ["$$warning", -1] },
                  { $multiply: ["$$issue", -2] },
                  { $multiply: ["$$complaint", -3] },
                ],
              },
              "$$totalReports",
            ],
          },
        },
        in: {
          $min: [
            5,
            {
              $max: [1, { $add: [5, "$$weightedScore"] }],
            },
          ],
        },
      },
    },
  },
};

/**
 * Main Aggregation Pipeline: getCustomerRatingPipeline
 * Includes paymentScore, businessStabilityScore, and reportScore
 */
export const getCustomerRatingPipeline = (): PipelineStage[] => [
  // --- 1️⃣ Lookup Reports ---
  {
    $lookup: {
      from: "reports",
      localField: "_id",
      foreignField: "customerId",
      as: "reportDetails",
    },
  },
  {
    $addFields: {
      reportStats: {
        $arrayToObject: {
          $map: {
            input: ["appreciation", "warning", "issue", "complaint"],
            as: "type",
            in: {
              k: "$$type",
              v: {
                $size: {
                  $filter: {
                    input: "$reportDetails",
                    as: "r",
                    cond: { $eq: ["$$r.type", "$$type"] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // --- 2️⃣ Compute Report Score ---
  {
    $addFields: {
      reportScore: MongoReportScore,
    },
  },

  // --- 3️⃣ Compute Payment Score ---
  {
    $addFields: {
      paymentScore: {
        $cond: {
          if: { $gt: ["$totalInvoices", 0] },
          then: {
            $multiply: [
              5,
              {
                $divide: [
                  "$isFullyPaidOnTimeCount",
                  "$totalInvoices",
                ],
              },
            ],
          },
          else: 5,
        },
      },
    },
  },

  // --- 4️⃣ Compute Business Stability Score ---
  {
    $addFields: {
      businessStabilityScore: {
        $let: {
          vars: {
            daysActive: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          in: {
            $cond: {
              if: { $lt: ["$$daysActive", 30] },
              then: 2,
              else: {
                $cond: {
                  if: { $lt: ["$$daysActive", 180] },
                  then: 3,
                  else: {
                    $cond: {
                      if: { $lt: ["$$daysActive", 365] },
                      then: 4,
                      else: 5,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // --- 5️⃣ Weighted Overall Score ---
  {
    $addFields: {
      weightedOverallScore: {
        $round: [
          {
            $add: [
                multiply("$overallScore", 0.2),
                multiply("$paymentScore", 0.35),
                multiply("$businessStabilityScore", 0.1),
                multiply("$reportScore", 0.05),
                multiply("$rating.communication", 0.1),
                multiply("$rating.Behavior", 0.1),
                multiply("$rating.Performance", 0.1)
            ],
          },
          2,
        ],
      },
    },
  },

  // --- 6️⃣ Final Projection ---
  {
    $project: {
      rating: 1,
      overallScore: 1,
      paymentScore: 1,
      businessStabilityScore: 1,
      reportScore: 1,
      weightedOverallScore: 1,
      reportStats: 1,
    },
  },
];
