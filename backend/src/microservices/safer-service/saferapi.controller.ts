import { Request, Response, NextFunction } from "express";
import apiClient from "./service";
import { cacheWrapper } from "config/redis/cacheWrapper";
import { daysToMs } from "utils/daysToMs";
import { parseSaferAddress } from "utils";
import { ICommonUsdotData } from "./types";

export const getUsDotData=async(USDotNumber:string):Promise<ICommonUsdotData>=>{
    const response:ICommonUsdotData = await cacheWrapper({ key: USDotNumber, ttlSeconds: daysToMs(1) }, async () => {
      const apiResponse = await apiClient.get(`/usdot/snapshot/${USDotNumber}`)
      return apiResponse.data
    })
    if (response.physical_address) {
      response.shippingAddress = parseSaferAddress(response.physical_address)
    }
    if (response.mailing_address) {
      response.billingAddress = parseSaferAddress(response.mailing_address)
    }
    return response
}

/**
 * @description Get All Users
 * @type GET 
 * @path /api//allusers
 */
const getDataByUSDOT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const USDotNumber = req.params.usdotnumber;
    const response = await cacheWrapper({ key: USDotNumber, ttlSeconds: daysToMs(1) }, async () => {
      const apiResponse = await apiClient.get(`/usdot/snapshot/${USDotNumber}`)
      return apiResponse.data
    })
    if (response.physical_address) {
      response.shippingAddress = parseSaferAddress(response.physical_address)
    }
    if (response.mailing_address) {
      response.billingAddress = parseSaferAddress(response.mailing_address)
    }
    res.status(200).json({
      status: "success",
      data: response
    });
  } catch (error) {
    next(error)
  }
}
export { getDataByUSDOT }


