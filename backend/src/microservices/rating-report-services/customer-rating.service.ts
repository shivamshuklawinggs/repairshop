import { Types } from 'mongoose';

import  {  ICustomer } from 'models/Customer.model';
import ReportModal, { IComment } from 'models/rating-report.model';
export interface IPaymentRatingStats extends ICustomer {
  totalInvoices: number,
  totalAmountWithTax: number,
  recievedAmount: number,
  totalTaxAmount: number,
  balanceDue: number,
  overbalanceDue: number,
  isFullyPaidOnTimeCount: number,
  hasLatePaymentCount: number,
  isOverdueCount: number,
  ratingScore: number
}

export class CustomerRatingService {
  static async getCustomerReports(
    customerId: Types.ObjectId
  ): Promise<IComment[] | null> {
    const doc = await ReportModal.find({ customerId });
    return doc;
  }
    static async addCustomerReport(
   { customerId,
    text,
    createdBy,
    file,
    incidentDate,
    type}:Pick<IComment,'customerId' | 'text' | 'createdBy' | 'file' | 'incidentDate' | 'type'>
  ): Promise<IComment> {
    const doc = await ReportModal.create(
             {
            text,
            customerId,
            createdBy,
            file,
            incidentDate,
            type
          }
    );
    return doc;
  }
  static async deleteCustomerReport(
    commentId: Types.ObjectId
  ): Promise<void> {
    await ReportModal.findOneAndDelete({ _id: commentId });
    return 
  }
  static async getCarrierReports(
    carrierId: Types.ObjectId
  ): Promise<IComment[] | null> {
    const doc = await ReportModal.find({ carrierId });
    return doc;
  }
    static async addCarrierReport(
   { carrierId,
    text,
    createdBy,
    file,
    incidentDate,
    type}:Pick<IComment,'carrierId' | 'text' | 'createdBy' | 'file' | 'incidentDate' | 'type'>
  ): Promise<IComment> {
    const doc = await ReportModal.create(
             {
            text,
            carrierId,
            createdBy,
            file,
            incidentDate,
            type
          }
    );
    return doc;
  }
  static async deleteCarrierReport(
    commentId: Types.ObjectId
  ): Promise<void> {
    await ReportModal.findOneAndDelete({ _id: commentId });
    return 
  }
  static async getDriverReports(
    driverId: Types.ObjectId
  ): Promise<IComment[] | null> {
    const doc = await ReportModal.find({ driverId });
    return doc;
  }
  static async addDriverReport(
    { driverId,
     text,
     createdBy,
     file,
     incidentDate,
     type}:Pick<IComment,'driverId' | 'text' | 'createdBy' | 'file' | 'incidentDate' | 'type'>
   ): Promise<IComment> {
     const doc = await ReportModal.create(
              {
            text,
            driverId,
            createdBy,
            file,
            incidentDate,
            type
          }
    );
    return doc;
  }
  static async deleteDriverReport(
    commentId: Types.ObjectId
  ): Promise<void> {
    await ReportModal.findOneAndDelete({ _id: commentId });
    return 
  }
  static async getAverageReportRating(
    entityId: Types.ObjectId,
    entityType: 'customer' | 'carrier' | 'driver'
  ): Promise<{overallAvgRating:number,totalReports:number}> {
   const result = await ReportModal.aggregate([
    {
      $match:{[`${entityType}Id`]:new Types.ObjectId(entityId)}
    },
    {
      $addFields: {
        rating: {
          $switch: {
            branches: [
              { case: { $eq: ["$type", "warning"] }, then: 5 },
              { case: { $eq: ["$type", "issue"] }, then: 3 },
              { case: { $eq: ["$type", "complaint"] }, then: 1 },
            ],
            default: 0
          }
        }
      }
    },
    {
      $group: {
        _id: "$type",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        overallAvgRating: { $avg: "$avgRating" },
        totalReports: { $sum: "$count" },
      }
    }
  ]);

  return result[0] || { overallAvgRating: 0, totalReports: 0 };
  }
}