
import { NextFunction, Request, Response } from "express";
import  {  profitAndLoss } from "models/AccountType.model";
import { PipelineStage, Types } from "mongoose";
import DateTimeFilter from "utils/postedadate";
import { AppError } from "middlewares/error";
import {  ProfitAndLossReportService } from "./services/profitAndLoss.service";
import { allowedType, allowedreports } from "shared/pipelines/constant";
import { BalanceSheetReportService } from "./services/BalanceSheet.service";
import { AcRecievePayableSummaryReportService } from "./services/AcRecievePayableSummary.service";
import { AcRecievePayableDetailReportService } from "./services/AcRecievePayableDetailReportService.service";
import { GroupedInvoices, IAccountsPayableDetail } from "./types";
import { TrialBalanceReportService } from "./services/AcTrialBalance.service";
import { GeneralLedgerReportService } from "./services/GeneralLedgerReport.service";
import ChartOfAccount from "models/chartOfAccounts.model";
import { IBalanceSheetReportData } from "./types/balancesheet.interface.types";
import { LedgerTransactionModel, TransactionType } from "models/Ledger.model";
import { netProfitAndLoss } from "./services/netProfitAndLoss";
import { ChartOfAccountsExportService } from "./services/ChartOfAccountsExport.service";
import { ReportExportMultiFormatService } from "./services/ReportExportMultiFormat.service";
import { ProfitAndLossMonthlyReportService } from "./services/profitAndLoss.monthly.service";

export class ReportController {
  constructor() {
  }

  static transformAgingReportData(result: IAccountsPayableDetail) {

    const groups: Record<string, GroupedInvoices> = {}

    result.invoices.forEach((invoice) => {
      if (!groups[invoice.bucket]) {
        groups[invoice.bucket] = {
          bucket: invoice.bucket,
          bucketOrder: invoice.bucketOrder,
          invoices: [],
          totalAmount: 0,
          totalOpenBalance: 0
        }
      }
      groups[invoice.bucket].invoices.push(invoice)
      groups[invoice.bucket].totalAmount += invoice.amount
      groups[invoice.bucket].totalOpenBalance += invoice.openBalance
    })

    // Sort by bucket order
    // return result
    return Object.values(groups).sort((a, b) => a.bucketOrder - b.bucketOrder) as []
  }
  static async generateProfitAndLossReport(res: Response,  initalMatchStage: Record<string, any>): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        {
          $match: {
            type: { $in: profitAndLoss },
            companyId: new Types.ObjectId(res.locals.companyId),
          }
        },
        ...ProfitAndLossReportService({
          res,
          matchStage: initalMatchStage,
        }),

      ]
     const [data] = await ChartOfAccount.aggregate(pipline)
      return data
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async ProfitAndLossMonthlyReportService(res: Response,  initalMatchStage: Record<string, any>): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        {
          $match: {
            type: { $in: profitAndLoss },
            companyId: new Types.ObjectId(res.locals.companyId),
          }
        },
        ...ProfitAndLossMonthlyReportService({
          res,
          matchStage: initalMatchStage,
        }),

      ]
     const [data] = await ChartOfAccount.aggregate(pipline)
      return data
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async generateBalanceSheetReport(
  res: Response,
  initalMatchStage: Record<string, any>
): Promise<Record<string, any>> {
  try {
    // =====================================================
    // BUILD PIPELINE
    // =====================================================
       const [profitData = {} as Record<string, any>] =
      await ChartOfAccount.aggregate(
        netProfitAndLoss({
          matchStage: initalMatchStage,
          res,
        })
      ).limit(1);

    const { netProfit = 0 } = profitData;
    const pipeline: PipelineStage[] = [
 
      ...BalanceSheetReportService({
        res,
        allowedreporttype: "balance-sheet",
        matchStage: initalMatchStage,
        netProfit:netProfit
      }),
    ];

    // =====================================================
    // FETCH BALANCE SHEET DATA
    // =====================================================
    const [data = {} as IBalanceSheetReportData] =
      await ChartOfAccount.aggregate<IBalanceSheetReportData>(
        pipeline
      ).limit(1);
    return data;
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}
  static async AccountsReceivableSummaryReport({res,initalMatchStage,page,limit,end,customerId}:{res: Response, initalMatchStage: Record<string, any>, page: number, limit: number,end:Date,customerId?:string}): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        {
          $match: {
            ...initalMatchStage,
            companyId:new Types.ObjectId(res.locals.companyId),
            transactionType:TransactionType.INVOICE,
            balanceDue: { $gt: 0 },
            ...(customerId && { customerId: new Types.ObjectId(customerId) }),
          }
        },
        ...AcRecievePayableSummaryReportService({
          allowedreporttype: "AccountsReceiveable",
           page, limit,
           end:end
        }),
      ]

      const [result] = await LedgerTransactionModel.aggregate(pipline)
      const data = result?.data ?? [];
      const total = result?.total ?? 0;
      const totalData = result?.totalData ?? 0;

      return {
        data,
        totalData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async AccountsPayableSummaryReport({res,initalMatchStage,page,limit,end,customerId}:{res: Response, initalMatchStage: Record<string, any>, page: number, limit: number,end:Date,customerId?:string}): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        {
          $match: {
              ...initalMatchStage,
            companyId: new Types.ObjectId(res.locals.companyId),
            transactionType: TransactionType.BILL,
            balanceDue: { $gt: 0 },
            ...(customerId && { vendorId: new Types.ObjectId(customerId) }),
          }
        },
        ...AcRecievePayableSummaryReportService({
          allowedreporttype: "AccountsPayable",
          page, limit,
          end
        }),

      ]
      
      const [result] = await LedgerTransactionModel.aggregate(pipline)
      const data = result?.data ?? [];
      const total = result?.total ?? 0;
      const totalData = result?.totalData ?? 0;

      return {
        data,
        totalData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async AccountsPayableDetailReport({res,initalMatchStage,page,limit,end,customerId}:{res: Response, initalMatchStage: Record<string, any>, page: number, limit: number,end:Date,customerId?:string}): Promise<Record<string, any>> {
    try {
      // const pipline: PipelineStage[] = [
      //   {
      //     $match: {
      //       typeId: BalanceSheetTypeIds.AccountsPayable
      //     }
      //   },
      //   ...AcRecievePayableDetailReportService({
      //     res,
      //     allowedreporttype: "AccountsPayableDetail",
      //     matchStage: initalMatchStage, page, limit
      //   }),
      // ]
      const pipline: PipelineStage[] = [
       {
          $match: {
              ...initalMatchStage,
            companyId: new Types.ObjectId(res.locals.companyId),
            transactionType: TransactionType.BILL,
            balanceDue: { $gt: 0 },
            ...(customerId && { vendorId: new Types.ObjectId(customerId) }),
          }
        },
        ...AcRecievePayableDetailReportService({
          allowedreporttype: "AccountsPayableDetail",
          page, limit,
          end:end
        }),
      ]
      const result = await LedgerTransactionModel.aggregate(pipline)
      const data = result ?? []
      const total = result?.length ?? 0;
      const totalDueAmount = result?.reduce((sum: number, item: any) => sum + (item.totalOpenBalance || 0), 0) ?? 0;
      const totalAmountWithTax = result?.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0) ?? 0;
      return {
        data: data,
        totalDueAmount,
        totalAmountWithTax,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async AccountsRecieveableDetailReport({res,initalMatchStage,page,limit,end,customerId}:{res: Response, initalMatchStage: Record<string, any>, page: number, limit: number,end:Date,customerId?:string}): Promise<Record<string, any>> {
    try {
   
      const pipline: PipelineStage[] = [
       {
          $match: {
              ...initalMatchStage,
            companyId: new Types.ObjectId(res.locals.companyId),
            transactionType: TransactionType.INVOICE,
            balanceDue: { $gt: 0 },
            ...(customerId && { customerId: new Types.ObjectId(customerId) }),
          }
        },
        ...AcRecievePayableDetailReportService({
          allowedreporttype: "AccountsRecieveableDetail",
          page, limit,
          end:end
        }),
      ]
      const result = await LedgerTransactionModel.aggregate(pipline)
      const data = result ?? []
      const total = result?.length ?? 0;
      const totalDueAmount = result?.reduce((sum: number, item: any) => sum + (item.totalOpenBalance || 0), 0) ?? 0;
      const totalAmountWithTax = result?.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0) ?? 0;
      return {
        data: data,
        totalDueAmount,
        totalAmountWithTax,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async TrialBalanceReport(res: Response, initalMatchStage: Record<string, any>): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        ...TrialBalanceReportService({
          res,
          matchStage: initalMatchStage
        }),

      ]
       const [result] = await LedgerTransactionModel.aggregate(pipline).limit(1)
      return {
        data: result,
      };

    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async GeneralLedgerReport(res: Response, initalMatchStage: Record<string, any>, paymentsPage: number = 1, paymentsLimit: number = 5, accountId?: string): Promise<Record<string, any>> {
    try {
      const pipline: PipelineStage[] = [
        ...GeneralLedgerReportService({
          res,
          matchStage: initalMatchStage,
          paymentsPage,
          paymentsLimit,
          accountId
        }),

      ]
      const [result] = await ChartOfAccount.aggregate(pipline).limit(1)
      return {
        data: result,
      };

    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
  static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as allowedreports;
      const allowedType = req.query.allowedType as allowedType;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const customerId = req.query.customerId as string;
      const {initalMatchStage,end=new Date()} = DateTimeFilter.FilterByDate({ fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {} })
  
      
      // 🧾 Data container
      let data: any = {}

      // 📊 Generate reports based on type
      switch (type) {
        case 'profit-and-loss':
          if (allowedType === "all") {
            data.data = await ReportController.generateProfitAndLossReport(res, initalMatchStage);
          }
          else if (allowedType === "month") {
            data.data = await ReportController.ProfitAndLossMonthlyReportService(res, initalMatchStage);
          }
          break;

        case 'balance-sheet':
          data.data = await ReportController.generateBalanceSheetReport(res, initalMatchStage);
          break;

        case 'AccountsReceiveable':

          data.data = await ReportController.AccountsReceivableSummaryReport({res, initalMatchStage, page, limit,end,customerId});

          break;

        case 'AccountsPayable':
          data.data = await ReportController.AccountsPayableSummaryReport({res, initalMatchStage, page, limit,end,customerId});
          break;

        case 'AccountsPayableDetail':
          data = await ReportController.AccountsPayableDetailReport({res, initalMatchStage, page, limit,end,customerId});
          break;

        case 'AccountsRecieveableDetail':
          data = await ReportController.AccountsRecieveableDetailReport({res, initalMatchStage, page, limit,end,customerId});
          break;

        case 'TrialBalanceReport':
          data = await ReportController.TrialBalanceReport(res, {
            postingDate: {
              $lte: new Date(req.query.fromDate as string)
            }
          });
          break;

        case 'GeneralLedgerReport':
          const paymentsPage = Number(req.query.paymentsPage) || 1;
          const paymentsLimit = Number(req.query.paymentsLimit) || 5;
          const accountId = req.query.accountId as string
          data = await ReportController.GeneralLedgerReport(res, initalMatchStage, paymentsPage, paymentsLimit, accountId);
          break;
        default:
          throw new Error('Invalid report type');
      }
      // 🟢 Send response
      res.status(200).json({
        ...data,
        fromCache: false,
        status: 200,
        message: 'success',
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportChartOfAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await ChartOfAccountsExportService(res);
      
      res.status(200).json({
        data: {
          filename:"chartofaccounts..xlsx",
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          base64: csvData
        },
        status: 200,
        message: 'Chart of accounts exported successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as allowedreports;
      const format = (req.query.format as string) || 'csv';
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 1000;
      const customerId = req.query.customerId as string;
      const { initalMatchStage, end = new Date() } = DateTimeFilter.FilterByDate({
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        field: 'postingDate',
        initialMatchStage: {},
      });

      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;
      const dateRange = `${ReportExportMultiFormatService.formatDate(fromDate)} - ${ReportExportMultiFormatService.formatDate(toDate)}`;
      const asOfDate = ReportExportMultiFormatService.formatDate(fromDate);

      let exportData: any;
      let reportData: any;

      switch (type) {
        case 'profit-and-loss':
          reportData = await ReportController.generateProfitAndLossReport(res, initalMatchStage);
          exportData = await ReportExportMultiFormatService.exportProfitAndLoss(reportData, res, format, dateRange);
          break;

        case 'profit-and-loss-month':
          reportData = await ReportController.ProfitAndLossMonthlyReportService(res, initalMatchStage);
          exportData = await ReportExportMultiFormatService.exportProfitAndLossByMonth(reportData, res, format, dateRange);
          break;

        case 'balance-sheet':
          reportData = await ReportController.generateBalanceSheetReport(res, initalMatchStage);
          exportData = await ReportExportMultiFormatService.exportBalanceSheet(reportData, res, format, dateRange);
          break;

        case 'AccountsReceiveable':
          reportData = await ReportController.AccountsReceivableSummaryReport({ res, initalMatchStage, page, limit, end, customerId });
          exportData = await ReportExportMultiFormatService.exportAccountsReceivable(reportData, res, format, dateRange);
          break;

        case 'AccountsPayable':
          reportData = await ReportController.AccountsPayableSummaryReport({ res, initalMatchStage, page, limit, end, customerId });
          exportData = await ReportExportMultiFormatService.exportAccountsPayable(reportData, res, format, dateRange);
          break;

        case 'AccountsPayableDetail':
          reportData = await ReportController.AccountsPayableDetailReport({ res, initalMatchStage, page, limit, end, customerId });
          exportData = await ReportExportMultiFormatService.exportAccountsPayableDetail(reportData, res, format, dateRange);
          break;

        case 'AccountsRecieveableDetail':
          reportData = await ReportController.AccountsRecieveableDetailReport({ res, initalMatchStage, page, limit, end, customerId });
          exportData = await ReportExportMultiFormatService.exportAccountsReceivableDetail(reportData, res, format, dateRange);
          break;

        case 'TrialBalanceReport':
          reportData = await ReportController.TrialBalanceReport(res, {
            postingDate: {
              $lte: new Date(fromDate)
            }
          });
          exportData = await ReportExportMultiFormatService.exportTrialBalance(reportData.data, res, format, asOfDate);
          break;

        case 'GeneralLedgerReport':
          const paymentsPage = Number(req.query.paymentsPage) || 1;
          const paymentsLimit = Number(req.query.paymentsLimit) || 1000;
          const accountId = req.query.accountId as string;
          reportData = await ReportController.GeneralLedgerReport(res, initalMatchStage, paymentsPage, paymentsLimit, accountId);
          exportData = await ReportExportMultiFormatService.exportGeneralLedger(reportData.data, res, format, dateRange);
          break;

        default:
          throw new Error('Invalid report type');
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
        res.send(exportData);
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
        res.send(exportData);
      } else {
        res.status(200).json({
          data: exportData,
          status: 200,
          message: `${type} report exported successfully as JSON`,
        });
      }
    } catch (error) {
      next(error);
    }
  }

}
