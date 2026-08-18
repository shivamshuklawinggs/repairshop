import { Request, Response } from "express";
import { createRegex } from "libs";
import Customer from "models/Customer.model";
import { Types } from "mongoose";
import { getServicesByCreatedBy } from "utils/CreatedBy.Pipeline.Service";
interface CustomerFilterResponseData {
  carrier_operation_list: string[];
  operating_status_list: string[]
}
interface ReqQuery {
  hasOpenBalance: string, search: string, status: string,
  ratingMin: string, operatingStatus: string, carrierOperation: string,
  ratingMax: string
}
export const CustomerFilters = (req: Request, initmatchStage: Record<string, any>): { matchStage: Record<string, any>, initmatchStage: Record<string, any> } => {
  const matchStage: Record<string, any> = {}
  try {
    const {
      hasOpenBalance, search, status,
      ratingMin, operatingStatus, carrierOperation,
      ratingMax
    } = req.query as unknown as ReqQuery

    if (hasOpenBalance==="true") {
      initmatchStage["summary.balanceDue"] = {
        $gt: 0
      }
    }
    if (carrierOperation) {
      initmatchStage["entityDetails.carrier_operation"] = {
        $in: carrierOperation?.split(",")
      }
    }
    if (operatingStatus) {
      initmatchStage["entityDetails.operating_status"] = {
        $in: operatingStatus?.split(",")
      }
    }
    // Rating range filter
    if (ratingMin || ratingMax) {
      initmatchStage['stars'] = {
        $ne: null
      }
      if (ratingMin) initmatchStage['stars']['$gte'] = Number(ratingMin);
      if (ratingMax) initmatchStage['stars']['$lte'] = Number(ratingMax);
    }
    if (search) {
      initmatchStage["$or"] = [
        { usdot: createRegex(search as string) },
        { company: createRegex(search as string) },
        { mcNumber: createRegex(search as string) },
        { address: createRegex(search as string) },
        { contactPerson: createRegex(search as string) },
        { email: createRegex(search as string) },
        { phone: createRegex(search as string) },
        { alternatphone: createRegex(search as string) },
        { state: createRegex(search as string) },
        { zipCode: createRegex(search as string) },
      ]
    }
     if(status){
      initmatchStage["status"]=status
    }
    return { matchStage, initmatchStage }
  } catch (error) {
    return { matchStage, initmatchStage }
  }
}
export const CustomersGroup = async (req: Request, res: Response): Promise<CustomerFilterResponseData> => {
  try {
    const [data] = await Customer.aggregate<CustomerFilterResponseData>([
      ...getServicesByCreatedBy({
        req, matchStage: {
          companyId: new Types.ObjectId(res.locals.companyId),
          $or: [
            { "entityDetails.operating_status": { $type: "string" } },
            { "entityDetails.carrier_operation": { $type: "string" } }
          ]
        }
      }),
      // 🔥 Drop all unused fields immediately
      {
        $project: {
          "entityDetails.operating_status": 1,
          "entityDetails.carrier_operation": 1
        }
      },

      {
        $facet: {
          operating_status_list: [
            { $match: { "entityDetails.operating_status": { $type: "string" } } },
            { $group: { _id: "$entityDetails.operating_status" } }
          ],
          carrier_operation_list: [
            { $match: { "entityDetails.carrier_operation": { $type: "string" } } },
            { $group: { _id: "$entityDetails.carrier_operation" } },
            {
              $unwind: {
                path: "$_id",
                preserveNullAndEmptyArrays: true
              }
            },
            { $group: { _id: "$_id" } }
          ]
        }
      },
      {
        $project: {
          operating_status_list: {
            $ifNull: [
              {
                $map: {
                  input: "$operating_status_list",
                  as: "s",
                  in: "$$s._id"
                }
              },
              []
            ]
          },
          carrier_operation_list: {
            $ifNull: [
              {
                $map: {
                  input: "$carrier_operation_list",
                  as: "c",
                  in: "$$c._id"
                }
              },
              []
            ]
          }
        }
      }
    ]).limit(1)
    return data
  } catch (error) {
    return { carrier_operation_list: [], operating_status_list: [] }
  }
}