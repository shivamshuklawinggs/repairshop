import { PipelineStage } from 'mongoose';

interface DebitNotesReportParams {
  matchStage: Record<string, any>;
  page: number;
  limit: number;
}

export function DebitNotesReportService({
  matchStage,
  page,
  limit,
}: DebitNotesReportParams): PipelineStage[] {
  const skip = (page - 1) * limit;

  return [
    { $match: matchStage },
    { $sort: { postingDate: -1 as const } },
    {
      $lookup: {
        from: 'carriers',
        localField: 'vendorId',
        foreignField: '_id',
        pipeline: [{ $project: { company: 1, email: 1, phone: 1 } }],
        as: 'vendor',
      },
    },
    { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              debitNoteNumber: 1,
              debitNoteDate: 1,
              postingDate: 1,
              reason: 1,
              status: 1,
              'summary.finalAmount': 1,
              'summary.appliedAmount': 1,
              'summary.remainingAmount': 1,
              'vendor.company': 1,
              'vendor.email': 1,
            },
          },
        ],
        total: [{ $count: 'count' }],
        totals: [
          {
            $group: {
              _id: null,
              totalFinalAmount: { $sum: '$summary.finalAmount' },
              totalApplied: { $sum: '$summary.appliedAmount' },
              totalRemaining: { $sum: '$summary.remainingAmount' },
            },
          },
        ],
      },
    },
    {
      $project: {
        data: 1,
        total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
        totals: { $ifNull: [{ $arrayElemAt: ['$totals', 0] }, {}] },
      },
    },
  ];
}
