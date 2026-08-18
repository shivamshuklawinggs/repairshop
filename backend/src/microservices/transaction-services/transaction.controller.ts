import { Request, Response, NextFunction } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import sendEmail from "libs/sendEmail";
import sendDocumentByEmailSchema, { transactionSchema } from "./transaction.validate";
import Customer from "models/Customer.model";
import Carrier from "models/Carrier.model";
import { AppError } from "middlewares/error";
import { parseJsonToCsv } from "utils/parseJsonToCsv";
import { transormTransaction } from "./service/utilities.service";
import { masterType } from 'models/AccountType.model'; import EstimateModal from "models/estimate.model";
import { LedgerTransactionModel, TransactionType } from "models/Ledger.model";
import { pipelineTypes } from "types/pipelineTypes";
import { getMasterAccount } from "utils/ledgerHelpers";
import { addPaymentMetaFields, buildPaymentStatusConfig } from "services/paymentQueryBuilder";

/**
 * @author Shivam Shukla
 * @version 1.0.0
 * @description Document Services
 * @date 11 june 2025
 * @license MIT
 * @copyright Copyright (c) 2025 Shivam Shukla
 * @file document.controller.ts
 * 
 */
const endingBalanceStage: Array<PipelineStage.Set | PipelineStage.SetWindowFields> = [
  {
    $set: {
      signedAmount: {
        $subtract: [
          { $ifNull: ["$debit", 0] },
          { $ifNull: ["$credit", 0] }
        ]
      }
    }
  },

  {
    $setWindowFields: {
      sortBy: { postingDate: 1 },
      output: {
        runningChange: {
          $sum: "$signedAmount",
          window: {
            documents: ["unbounded", "current"]
          }
        }
      }
    }
  },

  {
    $set: {
      balanceDue: {
        $concat: [
          {
            $toString: {
              $round: [
                { $abs: "$runningChange" },
                2
              ]
            }
          },
          " ",
          {
            $cond: [
              { $gte: ["$runningChange", 0] },
              "Dr",
              "Cr"
            ]
          }
        ]
      },
      balanceDuenumeric: {
        $round: [
          { $abs: "$runningChange" },
          2
        ]
      }
    }
  },
]
export default class GetDocument {

  static buildTransactionListPipeline = async ({
    type,
    req,
    res
  }: {
    type: TransactionType.INVOICE | TransactionType.BILL;
    req: Request;
    res: Response;
  }): Promise<PipelineStage[]> => {

    const { customerId, page, limit } = req.query;

    const year = Number(req.query.year || new Date().getFullYear());
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    if (!mongoose.isValidObjectId(customerId)) {
      throw new AppError("Customer is Required", 400);
    }

    // ================= MATCH =================
    const matchStage: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId),
      $expr: { $eq: [{ $year: "$postingDate" }, year] }
    };
    const dataStages: pipelineTypes = [
      {
        $sort: {
          postingDate: 1
        }
      },
      { $skip: skip },
      { $limit: limitNumber },
      {
        $project: {
          _id: 1,
          dueDate: 1,
          invoiceNumber: "$refrenceNo",
          BillNumber: "$refrenceNo",
          totalAmount: "$amount",
          totalAmountWithTax: "$amount",
          recievedAmount: "$totalRecieved",
          createdAt: 1,
          type: 1,
          amount: 1,
          paymentDate: "$postingDate",
          customerId: 1,
          postingDate: 1,
          vendorId: 1,
          transaction: "$transactionType",
          transactionType: 1,
          referenceId: 1,
          credits: 1,
          settledAmount: 1,
          status: 1,
          txnstatus: 1,
          debit: 1,
          credit: 1,
          summary: 1,
          description: 1,
          refrenceNo: 1
        }
      },
    ];
    if (type === TransactionType.INVOICE) {
      const receivableAccountId = await getMasterAccount(masterType.customer, new Types.ObjectId(res.locals.companyId));
      matchStage["accountId"] = new Types.ObjectId(receivableAccountId as string)
      matchStage.customerId = new Types.ObjectId(customerId as string);
    }

    if (type === TransactionType.BILL) {
      const payvableAccountId = await getMasterAccount(masterType.vendor, new Types.ObjectId(res.locals.companyId));
      matchStage["accountId"] = new Types.ObjectId(payvableAccountId as string)
      matchStage.vendorId = new Types.ObjectId(customerId as string);
    }

    // ================= COMMON LOOKUP =================
    const partyLookup =
      type === TransactionType.INVOICE
        ? {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
        }
        : {
          from: "carriers",
          localField: "vendorId",
          foreignField: "_id",
        };

    // ================= EXTRA STAGES =================
    const extraStages: pipelineTypes = [
      // party lookup
      {
        $lookup: {
          ...partyLookup,
          pipeline: [
            { $project: { name: { $ifNull: ["$company", "N/A"] } } }
          ],
          as: "party"
        }
      },
      {
        $addFields: {
          party: { $ifNull: [{ $arrayElemAt: ["$party.name", 0] }, "N/A"] },
          _id: "$referenceId"
        }
      },
      // flatten + default
      // ================= FINAL CALCULATIONS =================
      addPaymentMetaFields(),
      {
        $addFields: {
          // ✅ mixed record status
          status: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$transactionType", TransactionType.PAYMENT] },
                  then: "$txnstatus"
                },
                {
                  case: { $in: ["$transactionType", [TransactionType.INVOICE, TransactionType.BILL]] },
                  then: "$paymentStatus"
                }
              ],
              default: "unknown"
            }
          },
        }
      },
    ];

    // ================= FINAL PIPELINE =================
    return [
      { $match: matchStage },

      {
        $facet: {
          data: [
            ...dataStages,
            ...extraStages,
            ...endingBalanceStage
          ],
          totalCount: [{ $count: "count" }]
        }
      },

      {
        $addFields: {
          total: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0]
          },
          page: pageNumber,
          hasMore: {
            $gt: [
              { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
              skip + limitNumber
            ]
          },
          nextPage: {
            $cond: {
              if: {
                $gt: [
                  { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
                  skip + limitNumber
                ]
              },
              then: pageNumber + 1,
              else: null
            }
          }
        }
      },

      {
        $project: {
          data: 1,
          total: 1,
          page: 1,
          hasMore: 1,
          nextPage: 1
        }
      }
    ];
  };
  static buildTransactionCountMatch = async ({
    type,
    req,
    res
  }: {
    type: TransactionType.INVOICE | TransactionType.BILL;
    req: Request;
    res: Response
  }): Promise<PipelineStage[]> => {
    const { customerId } = req.query;
    if (!customerId) {
      throw new AppError("Cutomer is Required", 400)
    }
    const matchStage: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId),
    }

    // 👇 inject based on type
    if (type == TransactionType.INVOICE) {
      const receivableAccountId = await getMasterAccount(masterType.customer, new Types.ObjectId(res.locals.companyId));
      matchStage["accountId"] = new Types.ObjectId(receivableAccountId as string)
      matchStage["customerId"] = new Types.ObjectId(customerId as string)
    }

    if (type === TransactionType.BILL) {
      const payableAccountId = await getMasterAccount(masterType.vendor, new Types.ObjectId(res.locals.companyId));
      matchStage["accountId"] = new Types.ObjectId(payableAccountId as string)
      matchStage["vendorId"] = new Types.ObjectId(customerId as string)
    }
    return [
      {
        $match: matchStage
      },
      {
        $facet: {
          years: [
            {
              $group: {
                _id: { $year: "$postingDate" },
                total: { $sum: 1 }
              }
            },
            {
              $sort: { _id: 1 }
            }
          ]
        }
      }
    ];
  }
  /**
   * Send document via email
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async sendDocumentByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const body = await sendDocumentByEmailSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      // Send email with document attachment
      sendEmail(
        {
          to: body.recipientEmail,
          subject: body.subject,
          html: body.message || "Please find the attached document.",
          attachments: body.documentPaths.map((document: any) => document)
        }
      );

      return res.status(200).json({
        success: true,
        message: "Document sent successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get estimates
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async getEstimates(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { customerId = "", } = req.query
      const match: Record<string, any> = {
        customerId: new Types.ObjectId(customerId as string),
        companyId: new Types.ObjectId(res.locals.companyId),
      }

      const [result] = await EstimateModal.aggregate([
        {
          $match: match
        },
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  type: 1,
                  invoiceNumber: 1,
                  invoiceDate: 1,
                  dueDate: 1,
                  status: 1,
                  expense: 1,
                  totalAmountWithTax: "$summary.finalAmount",
                  totalTaxAmount: "$summary.taxTotal",
                  totalAmount: "$summary.subTotal",
                  recievedAmount: "$summary.totalRecieved",
                  balanceDue: "$summary.balanceDue",
                  recievedPaymentAmount: 1
                }
              }
            ],
            total: [
              {
                $group: {
                  _id: null,
                  totalBalance: { $sum: "$summary.finalAmount" },
                  totalRecievedAmount: { $sum: "$summary.totalRecieved" },
                  totalDueAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ]
          }
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$total", 0] }
          }
        }
      ])

      res.status(200).json({
        data: {
          success: true,
          data: result.data,
          totalBalance: result.total?.totalBalance || 0,
          totalRecievedAmount: result.total?.totalRecievedAmount || 0,
          totalDueAmount: result.total?.totalDueAmount || 0
        },
        success: true,
        statusCode: 200,
        message: "Estimates fetched successfully"
      })
    } catch (error) {
      next(error)
    }
  }
  /**
  * Get transaction list
  * @param req Request
  * @param res Response
  * @param next NextFunction
  */
  static async TransactionList(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {

      const pipeline = await GetDocument.buildTransactionListPipeline({
        type: TransactionType.INVOICE,
        res,
        req
      });
      const [finalData] = await LedgerTransactionModel.aggregate(pipeline)
      res.status(200).json({
        data: finalData.data,
        total: finalData.total,
        hasMore: finalData.hasMore,
        page: finalData.page,
        nextPage: finalData.nextPage,
        success: true,
        statusCode: 200,
        message: "Fetched successfully"
      });

    } catch (err) {
      next(err);
    }
  }
  /**
  * Get bill transaction list
  * @param req Request
  * @param res Response
  * @param next NextFunction
  */
  static async BillTransactionList(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await GetDocument.buildTransactionListPipeline({
        type: TransactionType.BILL,
        res,
        req
      });
      const [finalData] = await LedgerTransactionModel.aggregate(pipeline)
      res.status(200).json({
        data: finalData.data,
        total: finalData.total,
        hasMore: finalData.hasMore,
        page: finalData.page,
        nextPage: finalData.nextPage,
        success: true,
        statusCode: 200,
        message: "Fetched successfully"
      });
    } catch (err) {
      next(err);
    }
  }
  /**
   * Get transaction list Count
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async TotalTransactionCount(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as masterType
      req.query = await transactionSchema.validate(req.query, { abortEarly: false, stripUnknown: true })
      const pipeline = await GetDocument.buildTransactionCountMatch({ type: type == masterType.customer ? TransactionType.INVOICE : TransactionType.BILL, res, req })
      const [data] = await LedgerTransactionModel.aggregate(pipeline).limit(1)
      res.status(200).json({
        data: data,
        success: true,
        statusCode: 200,
        message: "fetched successfully"
      })
    } catch (err) {
      next(err);
    }
  }
  /**
   * Get customer invoice details
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async getCustomerInvoiceDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId = "" } = req.query

      const receivableAccountId = await getMasterAccount(masterType.customer, new Types.ObjectId(res.locals.companyId));

      const match: Record<string, any> = {
        accountId: new Types.ObjectId(receivableAccountId as string),
        customerId: new Types.ObjectId(customerId as string),
      }

      const [NonAcCustomerData] = await Customer.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(customerId as string)
          }
        },
        {
          $lookup: {
            from: "paymentterms",
            localField: "paymentTerms",
            foreignField: "_id",
            as: "paymentTerms"
          }
        },
        {
          $unwind: {
            path: "$paymentTerms",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            company: "$company",
            billingAddress: {
              address: { $ifNull: ["$address", ""] },
              city: { $ifNull: ["$city", ""] },
              state: { $ifNull: ["$state", ""] },
              zipCode: { $ifNull: ["$zipCode", ""] },
              country: { $ifNull: ["$country", ""] }
            },
            shippingAddress: {
              address: { $ifNull: ["$address", ""] },
              city: { $ifNull: ["$city", ""] },
              state: { $ifNull: ["$state", ""] },
              zipCode: { $ifNull: ["$zipCode", ""] },
              country: { $ifNull: ["$country", ""] }
            },
            paymentTerms: {
              $cond: [
                { $ne: ["$paymentTerms", null] },
                { $concat: ["$paymentTerms.name", " (", { $toString: "$paymentTerms.days" }, " days)"] },
                ""
              ]
            }

          }
        },
      ])
      const [result] = await LedgerTransactionModel.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: "$credit" },
            totalDebits: { $sum: "$debit" },
            totalDueAmount: { $sum: "$summary.balanceDue" },
            totalAmount: { $sum: "$summary.finalAmount" },
            totalOverDueAmt: {
              $sum: {
                $cond: [
                  buildPaymentStatusConfig()["overdue"].aggregationCase, // dueDate < today
                  "$summary.balanceDue",
                  0
                ]
              }
            },
            totalRecieved: { $sum: "$summary.totalRecieved" },
          }
        },
      ])
      res.status(200).json({
        data: { ...result, ...NonAcCustomerData },
        success: true,
        result: result,
        statusCode: 200,
        message: "Invoice details fetched successfully"
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Get customer invoice details
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async getCustomerBillsDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId = "" } = req.query
      const payvableAccountId = await getMasterAccount(masterType.vendor, new Types.ObjectId(res.locals.companyId));
      const match: Record<string, any> = {
        vendorId: new Types.ObjectId(customerId as string),
        accountId: new Types.ObjectId(payvableAccountId as string)
      }
      const [NonAcCustomerData] = await Carrier.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(customerId as string)
          }
        },
        {
          $lookup: {
            from: "paymentterms",
            localField: "paymentTerms",
            foreignField: "_id",
            as: "paymentTerms"
          }
        },
        {
          $unwind: {
            path: "$paymentTerms",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            company: { $ifNull: ["$company", "$company"] },
            billingAddress: {
              address: { $ifNull: ["$billingAddress.address", "$address"] },
              city: { $ifNull: ["$billingAddress.city", "$city"] },
              state: { $ifNull: ["$billingAddress.state", "$state"] },
              zipCode: { $ifNull: ["$billingAddress.zipCode", "$zipCode"] },
              country: { $ifNull: ["$billingAddress.country", "$country"] }
            },
            shippingAddress: {
              address: { $ifNull: ["$shippingAddress.address", "$address"] },
              city: { $ifNull: ["$shippingAddress.city", "$city"] },
              state: { $ifNull: ["$shippingAddress.state", "$state"] },
              zipCode: { $ifNull: ["$shippingAddress.zipCode", "$zipCode"] },
              country: { $ifNull: ["$shippingAddress.country", "$country"] }
            },
            paymentTerms: {
              $cond: [
                { $ne: ["$paymentTerms", null] },
                { $concat: ["$paymentTerms.name", " (", { $toString: "$paymentTerms.days" }, " days)"] },
                ""
              ]
            }

          }
        },


      ])
      const [result] = await LedgerTransactionModel.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: "$credit" },
            totalDebits: { $sum: "$debit" },
            totalDueAmount: { $sum: "$summary.balanceDue" },
            totalAmount: { $sum: "$summary.finalAmount" },
            totalOverDueAmt: {
              $sum: {
                $cond: [
                  buildPaymentStatusConfig()["overdue"].aggregationCase, // dueDate < today
                  "$summary.balanceDue",
                  0
                ]
              }
            },
            totalRecieved: { $sum: "$summary.totalRecieved" },
          }
        },
      ])
      res.status(200).json({
        data: { ...result, ...NonAcCustomerData },
        success: true,
        statusCode: 200,
        message: "Bill details fetched successfully"
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * export   all transactions
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {
      req.query = await transactionSchema.validate(req.query, { abortEarly: false, stripUnknown: true })
      const type = req.query.type as masterType
      const pipeline = await GetDocument.buildTransactionListPipeline({
        type: type === masterType.customer ? TransactionType.INVOICE : TransactionType.BILL,
        res,
        req
      });
      const [{ data }] = await LedgerTransactionModel.aggregate(pipeline)
      if (data.length === 0) throw new AppError("No data found to export", 404)

      // Define the fields for the CSV
      const fields = [
        { value: "date", label: "Date" },
        { value: "transaction", label: "Transaction" },
        { value: "invoiceNumber", label: "Ref Number" },
        { value: "customer", label: "Customer" },
        { value: "amount", label: "Amount" },
        { value: "status", label: "Status" },
      ]
      const trandformdata = data.map((invoice: any) => {
        return {
          ...invoice,
          ...transormTransaction(invoice)
        }
      })

      const base64 = parseJsonToCsv(trandformdata, fields)

      res.status(200).json({
        success: true, statusCode: 204,
        data: {
          filename: 'transactions.csv',
          mimeType: 'text/csv',
          base64: base64
        }
      });
    } catch (error) {
      next(error)
    }
  }
}
