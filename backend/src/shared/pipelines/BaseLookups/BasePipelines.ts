import { PipelineStage } from "mongoose"
import { masterType } from 'models/AccountType.model';
import {  allowedreports, excludedReports } from "shared/pipelines/constant";
type  PiplineFields= Array<PipelineStage.Lookup |PipelineStage.Unwind  | PipelineStage.AddFields | PipelineStage.Group | PipelineStage.Match>
export const JournalEntrycustomerPipeLine = (): PiplineFields => [
  {
    $lookup: {
      from: "customers",
      localField: "entries.nameId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: { $ifNull: ["$company", "$company"] },
          }
        }
      ],
      as: "customer"
    }
  },
  { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "carriers",
      localField: "entries.nameId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: { $ifNull: ["$company", "$company"] },
            rate: 1
          }
        }
      ],
      as: "carrier"
    }
  },
  { $unwind: { path: "$carrier", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      customer: { $ifNull: ["$customer", "$carrier"] }
    }
  }
];

export const PaymentsCustomerPipeLine = (): PiplineFields => [
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      pipeline: [
        { $project: { name: { $ifNull: ["$company", "$company"] } } }
      ],
      as: "customer"
    }
  },
  { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "carriers",
      localField: "customerId",
      foreignField: "_id",
      pipeline: [
        { $project: { name: { $ifNull: ["$company", "$company"] }, rate: 1 } }
      ],
      as: "carrier"
    }
  },
  { $unwind: { path: "$carrier", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      customer: { $ifNull: ["$customer", "$carrier"] }
    }
  }
];

export const customerPipeLine = (type: masterType): PiplineFields => {
  const data: PiplineFields = []
  if (type === masterType.customer) {
    data.push(
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: { $ifNull: ["$company", "$company"] },
                rate: 1
              }
            }
          ],
          as: "customer"
        }
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    )
  } else if (type === masterType.vendor) {
    data.push(
      {
        $lookup: {
          from: "carriers",
          localField: "vendorId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: { $ifNull: ["$company", "$company"] },
                rate: 1
              }
            }
          ],
          as: "customer"
        }
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    )
  }
  return data
}



export const conditionalCustomerPipeline = (
  {type,allowedreporttype}: {type: masterType,
  allowedreporttype?: allowedreports}
): PiplineFields => {
  return !allowedreporttype || !excludedReports.includes(allowedreporttype)
    ? customerPipeLine(type)
    : [];
};



