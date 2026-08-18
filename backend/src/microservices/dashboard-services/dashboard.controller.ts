
import { Request, Response, NextFunction } from "express";
import InvoiceModal from "models/Invoice.model";
import { PipelineStage, Types } from "mongoose";
import BillModal from "models/Bill.model";
import { parseJSON } from "libs";
import { todayDate } from "config/constant";
import DateTimeFilter from "utils/postedadate";

import { profitAndLossDataPipeline, accountsReceivablePipeline, accountsPayablePipeline } from "./dashboard.service"
import ChartOfAccount from "models/chartOfAccounts.model";
import { salesDataPipeline } from "./services/salesDataPipeline";
import { expensePipeline } from "./services/expensePipeline";
import { LedgerTransactionModel, TransactionType } from "models/Ledger.model";

interface CustomerDashboardData {
  overdueInvoices: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  paidInvoices: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  totalInvoices: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  recentPaidInvoices: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  partialInvoices: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  open: {
    count: number;
    totalAmount: number;
    percentage: number;
  }
}


/**
 * Reusable function to calculate percentage in MongoDB aggregation
 * @param numerator - The numerator field path
 * @param denominator - The denominator field path
 * @returns MongoDB aggregation expression that calculates percentage (0-100)
 */
const calculatePercentage = (numerator: string, denominator: string) => ({
  $cond: {
    if: { $gt: [denominator, 0] },
    then: {
      $multiply: [
        { $divide: [numerator, denominator] },
        100
      ]
    },
    else: 0
  }
});

class GetDashboard {
  constructor() {
    this.profitAndLoss = this.profitAndLoss.bind(this)
    this.sales = this.sales.bind(this)
    this.accountsReceivable = this.accountsReceivable.bind(this)
    this.accountsPayable = this.accountsPayable.bind(this)
    this.expense = this.expense.bind(this)
    this.getCustomerData = this.getCustomerData.bind(this)
    this.getVendorData = this.getVendorData.bind(this)
    this.invoicesAndBillsSummary = this.invoicesAndBillsSummary.bind(this)
  }
  async profitAndLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const { initalMatchStage } = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
      const pipline: PipelineStage[] = [
        ...profitAndLossDataPipeline({
          res,
          matchStage: initalMatchStage
        }),
      ]
      const [result] = await ChartOfAccount.aggregate(pipline)
      return res.status(200).json({ data: result, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }
  async sales(req: Request, res: Response, next: NextFunction) {
    try {
      const { initalMatchStage } = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
      const pipline: PipelineStage[] = [
        ...salesDataPipeline({
          res,
          matchStage: initalMatchStage
        }),
      ]
      const [result] = await ChartOfAccount.aggregate(pipline)
      return res.status(200).json({ data: result, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }
  async accountsReceivable(req: Request, res: Response, next: NextFunction) {
    try {
      const { initalMatchStage } = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
      const pipline: PipelineStage[] = [
        ...accountsReceivablePipeline({
          res,
          matchStage: initalMatchStage
        }),
      ]
      const [result] = await ChartOfAccount.aggregate(pipline)
      return res.status(200).json({ data: result, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }
  async accountsPayable(req: Request, res: Response, next: NextFunction) {
    try {
      const { initalMatchStage } = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
      const pipline: PipelineStage[] = [
        ...accountsPayablePipeline({
          res,
          matchStage: initalMatchStage
        }),
      ]
      const [result] = await ChartOfAccount.aggregate(pipline)
      return res.status(200).json({ data: result, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }
  async expense(req: Request, res: Response, next: NextFunction) {
    try {
      const { initalMatchStage } = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
      const pipline: PipelineStage[] = [
        ...expensePipeline({
          res,
          matchStage: initalMatchStage
        }),
      ]
      const [result] = await ChartOfAccount.aggregate(pipline)
      return res.status(200).json({ data: result, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }


  async getCustomerData(req: Request, res: Response, next: NextFunction) {
    try {
      const matchStacge: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
      }
      let { lastDays = 7 } = req.query
      lastDays = parseJSON(lastDays as string)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      // recent 7 days
      const reacentBetween = {
        $gte: today.setDate(today.getDate() - Number(lastDays)), // last 7 days
        $lte: today // current date
      }
      const defaultDataAssign = {
        count: 0,
        totalAmount: 0
      }
      const [aggResult] = await InvoiceModal.aggregate<CustomerDashboardData>([
        {
          $match: matchStacge
        },
        {
          $facet: {
            overdueInvoices: [
              { $match: { "summary.balanceDue": { $gt: 0 }, "summary.totalRecieved": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            paidInvoices: [
              { $match: { "summary.balanceDue": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            recentPaidInvoices: [
              {
                $match: {
                  "summary.balanceDue": { $eq: 0 },
                  "recievedPaymentAmount": { $elemMatch: { createdAt: reacentBetween } }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              },

            ],
            open: [
              { $match: { "summary.balanceDue": { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            totalInvoices: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count all documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            partialInvoices: [
              {
                $match: {
                  "summary.balanceDue": { $gt: 0 },
                  "summary.totalRecieved": { $gt: 0 }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.totalRecieved" }
                }
              },

            ],
          }
        },
        {
          $project: {
            overdueInvoices: {
              $ifNull: [{ $arrayElemAt: ["$overdueInvoices", 0] }, defaultDataAssign]
            },
            paidInvoices: {
              $ifNull: [{ $arrayElemAt: ["$paidInvoices", 0] }, defaultDataAssign]
            },
            totalInvoices: {
              $ifNull: [{ $arrayElemAt: ["$totalInvoices", 0] }, defaultDataAssign]
            },
            recentPaidInvoices: {
              $ifNull: [{ $arrayElemAt: ["$recentPaidInvoices", 0] }, defaultDataAssign]
            },
            partialInvoices: {
              $ifNull: [{ $arrayElemAt: ["$partialInvoices", 0] }, defaultDataAssign]
            },
            open: {
              $ifNull: [{ $arrayElemAt: ["$open", 0] }, defaultDataAssign]
            }
          }
        },
        {
          $addFields: {
            "overdueInvoices.percentage": calculatePercentage("$overdueInvoices.count", "$overdueInvoices.count"),
            "paidInvoices.percentage": calculatePercentage("$paidInvoices.count", "$paidInvoices.count"),
            "recentPaidInvoices.percentage": calculatePercentage("$recentPaidInvoices.count", "$recentPaidInvoices.count"),
            "partialInvoices.percentage": calculatePercentage("$partialInvoices.count", "$partialInvoices.count"),
            "open.percentage": calculatePercentage("$open.count", "$open.count"),

          }
        }
      ])
      return res.status(200).json({ data: aggResult, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }

 
  async getVendorData(_req: Request, res: Response, next: NextFunction) {
    try {
      const matchStacge: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const recentBetween = {
        $gte: today.setDate(today.getDate() - 7),
        $lte: today
      }

      const defaultDataAssign = { count: 0, totalAmount: 0 }

      // Optimized single aggregation for bill data


      const [billResult] = await BillModal.aggregate<CustomerDashboardData>([
        {
          $match: matchStacge
        },
        {
          $facet: {
            overdueInvoices: [
              { $match: { "summary.balanceDue": { $gt: 0 }, "summary.totalRecieved": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            paidInvoices: [
              { $match: { "summary.balanceDue": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            recentPaidInvoices: [
              {
                $match: {
                  "summary.balanceDue": { $eq: 0 },
                  "recievedPaymentAmount": { $elemMatch: { createdAt: recentBetween } }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              },

            ],
            open: [
              { $match: { "summary.balanceDue": { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            totalInvoices: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count all documents
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            partialInvoices: [
              {
                $match: {
                  "summary.balanceDue": { $gt: 0 },
                  "summary.totalRecieved": { $gt: 0 }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },  // Count documents
                  totalAmount: { $sum: "$summary.totalRecieved" }
                }
              },

            ],
          }
        },
        {
          $project: {
            overdueInvoices: {
              $ifNull: [{ $arrayElemAt: ["$overdueInvoices", 0] }, defaultDataAssign]
            },
            paidInvoices: {
              $ifNull: [{ $arrayElemAt: ["$paidInvoices", 0] }, defaultDataAssign]
            },
            totalInvoices: {
              $ifNull: [{ $arrayElemAt: ["$totalInvoices", 0] }, defaultDataAssign]
            },
            recentPaidInvoices: {
              $ifNull: [{ $arrayElemAt: ["$recentPaidInvoices", 0] }, defaultDataAssign]
            },
            partialInvoices: {
              $ifNull: [{ $arrayElemAt: ["$partialInvoices", 0] }, defaultDataAssign]
            },
            open: {
              $ifNull: [{ $arrayElemAt: ["$open", 0] }, defaultDataAssign]
            }
          }
        },
        {
          $addFields: {
            "overdueInvoices.percentage": calculatePercentage("$overdueInvoices.count", "$overdueInvoices.count"),
            "paidInvoices.percentage": calculatePercentage("$paidInvoices.count", "$paidInvoices.count"),
            "recentPaidInvoices.percentage": calculatePercentage("$recentPaidInvoices.count", "$recentPaidInvoices.count"),
            "partialInvoices.percentage": calculatePercentage("$partialInvoices.count", "$partialInvoices.count"),
            "open.percentage": calculatePercentage("$open.count", "$open.count"),
          }
        }
      ])
      return res.status(200).json({ data: billResult, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }


  async cashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = new Types.ObjectId(res.locals.companyId);
      const { fromDate, toDate } = req.query;
      
      // Build date filter
      const dateFilter: any = { companyId };
      if (fromDate && toDate) {
        dateFilter.postingDate = {
          $gte: new Date(fromDate as string),
          $lte: new Date(toDate as string)
        };
      }

      const [result] = await LedgerTransactionModel.aggregate([
        {
          $match: dateFilter
        },
        {
          $facet: {
            // Cash inflows (credits from payments received)
            cashInflows: [
              {
                $match: {
                  entryType: "CREDIT",
                  transactionType: TransactionType.PAYMENT
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: "$postingDate" },
                    month: { $month: "$postingDate" }
                  },
                  totalAmount: { $sum: "$credit" },
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 1,
                  paymentAmount: "$totalAmount",
                  totalInflow: "$totalAmount",
                  transactionCount: "$count"
                }
              },
              {
                $sort: { "_id.year": 1, "_id.month": 1 }
              }
            ],
            
            // Cash outflows (debits from payments made)
            cashOutflows: [
              {
                $match: {
                  entryType: "DEBIT",
                  transactionType: TransactionType.PAYMENT
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: "$postingDate" },
                    month: { $month: "$postingDate" }
                  },
                  totalAmount: { $sum: "$debit" },
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 1,
                  paymentAmount: "$totalAmount",
                  totalOutflow: "$totalAmount",
                  transactionCount: "$count"
                }
              },
              {
                $sort: { "_id.year": 1, "_id.month": 1 }
              }
            ],
            
            // Summary by payment type
            transactionSummary: [
              {
                $match: {
                  transactionType: TransactionType.PAYMENT
                }
              },
              {
                $group: {
                  _id: "$transactionType",
                  totalCredits: { $sum: "$credit" },
                  totalDebits: { $sum: "$debit" },
                  transactionCount: { $sum: 1 }
                }
              },
              {
                $addFields: {
                  netAmount: { $subtract: ["$totalCredits", "$totalDebits"] }
                }
              }
            ],
            
            // Overall totals (payments only)
            totals: [
              {
                $match: {
                  transactionType: TransactionType.PAYMENT
                }
              },
              {
                $group: {
                  _id: null,
                  totalCredits: { $sum: "$credit" },
                  totalDebits: { $sum: "$debit" },
                  transactionCount: { $sum: 1 }
                }
              },
              {
                $addFields: {
                  netCashFlow: { $subtract: ["$totalCredits", "$totalDebits"] }
                }
              }
            ]
          }
        },
        {
          $project: {
            cashInflows: 1,
            cashOutflows: 1,
            transactionSummary: 1,
            totals: { $arrayElemAt: ["$totals", 0] }
          }
        }
      ]);

      const defaultResult = {
        cashInflows: [],
        cashOutflows: [],
        transactionSummary: [],
        totals: {
          totalCredits: 0,
          totalDebits: 0,
          netCashFlow: 0,
          transactionCount: 0
        }
      };

      const data = result ?? defaultResult;

      return res.status(200).json({
        data: data,
        status: 200,
        message: "Cash flow data fetched successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  async invoicesAndBillsSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const initalMatchStage: Record<string, any> = { companyId: new Types.ObjectId(res.locals.companyId) }
      const defaultDataAssign = { count: 0, totalAmount: 0 }
      // Invoice aggregation
      const [invoiceResult] = await InvoiceModal.aggregate([
        {
          $match: initalMatchStage
        },
        {
          $facet: {
            totalInvoices: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            paidInvoices: [
              { $match: { "summary.balanceDue": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            overdueInvoices: [
              { $match: { "summary.balanceDue": { $gt: 0 }, "summary.totalRecieved": { $eq: 0 }, dueDate: { $lt: todayDate } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            openInvoices: [
              { $match: { "summary.balanceDue": { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            invoicePayments: [
              {
                $match: {
                  "summary.totalRecieved": { $gt: 0 }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.totalRecieved" }
                }
              }
            ]
          }
        },
        {
          $project: {
            totalInvoices: { $ifNull: [{ $arrayElemAt: ["$totalInvoices", 0] }, defaultDataAssign] },
            paidInvoices: { $ifNull: [{ $arrayElemAt: ["$paidInvoices", 0] }, defaultDataAssign] },
            overdueInvoices: { $ifNull: [{ $arrayElemAt: ["$overdueInvoices", 0] }, defaultDataAssign] },
            openInvoices: { $ifNull: [{ $arrayElemAt: ["$openInvoices", 0] }, defaultDataAssign] },
            invoicePayments: { $ifNull: [{ $arrayElemAt: ["$invoicePayments", 0] }, defaultDataAssign] }
          }
        }
      ])

      // Bill aggregation
      const [billResult] = await BillModal.aggregate([
        {
          $match: initalMatchStage
        },
        {
          $facet: {
            totalBills: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            paidBills: [
              { $match: { "summary.balanceDue": { $eq: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.finalAmount" }
                }
              }
            ],
            overdueBills: [
              { $match: { "summary.balanceDue": { $gt: 0 }, "summary.totalRecieved": { $eq: 0 }, dueDate: { $lt: todayDate } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            openBills: [
              { $match: { "summary.balanceDue": { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            billPayments: [
              {
                $match: {
                  "summary.totalRecieved": { $gt: 0 }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$summary.totalRecieved" }
                }
              }
            ]
          }
        },
        {
          $project: {
            totalBills: { $ifNull: [{ $arrayElemAt: ["$totalBills", 0] }, defaultDataAssign] },
            paidBills: { $ifNull: [{ $arrayElemAt: ["$paidBills", 0] }, defaultDataAssign] },
            overdueBills: { $ifNull: [{ $arrayElemAt: ["$overdueBills", 0] }, defaultDataAssign] },
            openBills: { $ifNull: [{ $arrayElemAt: ["$openBills", 0] }, defaultDataAssign] },
            billPayments: { $ifNull: [{ $arrayElemAt: ["$billPayments", 0] }, defaultDataAssign] }
          }
        }
      ])

      const summary = {
        invoices: invoiceResult,
        bills: billResult
      }

      return res.status(200).json({ data: summary, status: 200, message: "Documents fetched successfully" })
    } catch (error) {
      next(error)
    }
  }
}
export default new GetDashboard()
