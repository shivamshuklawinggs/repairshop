import { Request, Response, NextFunction } from 'express';
import Invoice from 'models/Bill.model';
import { AppError } from 'middlewares/error';
import { generateBillSchema } from './bill.validate';
import genearatePdf from './services/genearatePdf.service';
import GenerateInvoice from './services/generatebill.service';
import { updateCarrierInvoice } from './services/updatebill.service';
import {  validateDocumentExistence } from 'utils/expenseUtils';
import pagination from 'utils/pagination';
import mongoose, { PipelineStage, Types } from 'mongoose';

import TaxService from 'models/tax.model';
import ProductService from 'models/product-service.model';
import PaymentTerms from 'models/PaymentTerms.model';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import Carrier from 'models/Carrier.model';
import { duplicateProductServiceValidator } from 'utils/InvoiceAndBIllValdator';
import { todayDate } from 'config/constant';
import { vendorPipeLine } from 'utils/transactionPipelines';
import { BillResponse } from './types';
import { formatCurrency, formatDate } from 'utils';
import { parseJsonToCsv } from 'utils/parseJsonToCsv';
import { Producer } from 'config/rabbitmq/producers';
import { TransactionType, ledgerAdapter } from 'models/Ledger.model';
import { clean, parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import DateTimeFilter from 'utils/postedadate';
import { addPaymentMetaFields, addvansePayments, PaymentStatus } from 'services/paymentQueryBuilder';
import { getTransactionStatus } from 'microservices/transaction-services/service/utilities.service';
import { mergeWithBaseFilters, TransactionFilterParams } from 'services/transactionFilters.service';
import DocumentGenerationService from 'services/documentGeneration.service';

export default class BillController {
  static billPipline = (): Array<PipelineStage.AddFields | PipelineStage.Lookup | PipelineStage.Unwind | PipelineStage.Project> => {
    return [addPaymentMetaFields(),
    addvansePayments("vendor"),
    {
      $project: {
        'BillNumber': 1,
        'vendorId': 1,
        'invoiceDate': 1,
        'dueDate': 1,
        paymentStatus: 1,
        isLate: 1,
        'totalAmount': "$summary.finalAmount",
        'receivedAmount': "$summary.totalRecieved",
        'balanceDue': "$summary.balanceDue",
        "Advance": { $ifNull: ["$Advance", []] },
        emailStatus: 1
      }
    },
    ...vendorPipeLine("vendorId"),
    ]
  };
  static generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      req.body = await parseCleanValidate(
        req.body.invoiceData,
        generateBillSchema
      );
      let response: {
        success: boolean,
        message: string,
        _id: string
      } = {
        success: false,
        message: "",
        _id: ""
      }
      response = await GenerateInvoice.generateCarrierInvoice(req, res, session);
    
      await ledgerAdapter.recordLedgerById({
        id: response._id as unknown as Types.ObjectId,
        session: session,
        type: TransactionType.BILL,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      await session.commitTransaction();
      if (req.body.email && req.body.actionType && response._id) {
        response.message = await Producer.generateBill(response._id)
      }
      return res.status(200).json(response);
    } catch (error) {
      await session.abortTransaction();
      next(error)
    }
    finally {
      await session.endSession();
    }
  };
  static generatePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isPdf = "true" } = req.query
      const data = await genearatePdf.generatePdfData(req.params.invoiceId)
      if (isPdf == "true") {
        const pdfBuffer = Buffer.from(data as Base64URLString, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=bill.pdf');
        res.send(pdfBuffer);
        return
      }
      res.status(200).json({
        data: data
      })
    } catch (error) {
      next(error);
    }
  };
  static getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, carrierId, page = 1, limit = 10, startDate, endDate, search, paymentStatus, fromDate, toDate, minAmount, maxAmount } = req.query;
      
      const baseMatchStage: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
      }
      if (customerId) baseMatchStage["customerId"] = customerId;
      if (carrierId) baseMatchStage["carrierId"] = carrierId;

      // Apply transaction filters
      const filters: TransactionFilterParams = {
        search: search as string,
        paymentStatus: paymentStatus as PaymentStatus,
        fromDate: fromDate as string || startDate as string,
        toDate: toDate as string || endDate as string,
        minAmount: minAmount as string,
        maxAmount: maxAmount as string,
      };
      
      const matchStage = mergeWithBaseFilters(baseMatchStage, filters);
      const result = await Invoice.aggregate([
        {
          $match: matchStage
        },

        {
          $sort: { createdAt: -1 }
        },
        {
          $facet: {
            data: [
              ...pagination(page as string, limit as string),
             ...BillController.billPipline()

            ], // Ensure pagination returns an array of valid pipeline stages
            total: [{ $count: "total" }],
          }
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$total.total", 0] }, // Extract total count correctly
          }
        }
      ])
      // Ensure result is not empty and extract data correctly
      const data = result.length > 0 ? result[0].data : [];
      const total = result.length > 0 ? result[0].total || 0 : 0;


      res.status(200).json({
        data: data, success: true,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        statusCode: 200
      });
    } catch (error) {
      next(error);
    }
  };
  /**
    * export   all invoices
    * @param req Request
    * @param res Response
    * @param next NextFunction
    */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, carrierId, page = 1, limit = 10, startDate, endDate, } = req.query;
      const matchStage: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
      }
      if (customerId) matchStage["customerId"] = customerId;
      if (carrierId) matchStage["carrierId"] = carrierId;

      if (startDate && endDate) {
        matchStage["createdAt"] = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      const pipline: PipelineStage[] = [
        {
          $match: matchStage
        },
        {
          $sort: { createdAt: -1 }
        },
        ...pagination(page as string, limit as string),
       ...BillController.billPipline()
      ]
      const result = await Invoice.aggregate(pipline)

      if (result.length === 0) throw new AppError("No data found to export", 404)
      // }
      // Define the fields for the CSV
      const fields = [
        { value: "BillNumber", label: "Bill Number" },
        { value: "customer", label: "Customer" },
        { value: "status", label: "Status" },
        { value: "invoiceDate", label: "Invoice Date" },
        { value: "dueDate", label: "Due Date" },
        { value: "totalAmountWithTax", label: "Total Amount" },
        { value: "recievedAmount", label: "Recieved Amount" },
        { value: "balanceDue", label: "Due Amount" },
      ]
      const trandformdata = result.map((invoice: BillResponse) => {
        return {
          BillNumber: invoice.BillNumber,
          customer: invoice.carrier?.company || "",
          status: getTransactionStatus({
            credits: 0,
            type: TransactionType.BILL,
            paymentStatus: invoice.paymentStatus,
            dueDate: invoice.dueDate,
            balanceDue: invoice.balanceDue
          }).label,
          invoiceDate: invoice.invoiceDate ? formatDate(new Date(invoice.invoiceDate)) : "",
          dueDate: invoice.dueDate ? formatDate(new Date(invoice.dueDate)) : "",
          totalAmountWithTax: formatCurrency(invoice.totalAmount) || 0,
          recievedAmount: formatCurrency(invoice.receivedAmount) || 0,
          balanceDue: formatCurrency(invoice.balanceDue) || 0,

        }
      })
      const base64 = parseJsonToCsv(trandformdata, fields)

      res.status(200).json({
        success: true, statusCode: 204,
        data: {
          filename: 'bill.csv',
          mimeType: 'text/csv',
          base64: base64
        }
      });
    } catch (error) {
      next(error)
    }
  }
  static getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      const result = await Invoice.findById(invoiceId)
      if (!result) {
        throw new AppError('Invoice not found', 404);
      }
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
  static updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      req.body = await parseCleanValidate(
        req.body.invoiceData,
        generateBillSchema
      );
      let response: {
        success: boolean,
        message: string,
        _id: string
      } = {
        success: false,
        message: "",
        _id: ""
      }
      response = await updateCarrierInvoice(req, session, res);

      let invoiceId = req.params.invoiceId;
      await ledgerAdapter.recordLedgerById({
        id: invoiceId as unknown as Types.ObjectId,
        session: session,
        type: TransactionType.BILL,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      await session.commitTransaction();
      if (req.body.email && req.body.actionType) {
        response.message = await Producer.generateBill(invoiceId)
      }
      return res.status(200).json(response);
    } catch (error) {
      await session.abortTransaction();
      next(error);
    }
    finally {
      await session.endSession();
    }
  };
  static deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    try {
      const { invoiceId } = req.params;
      await session.withTransaction(async () => {
        const invoice = await Invoice.findByIdAndDelete(invoiceId);

        if (!invoice) {
          throw new AppError('Invoice not found', 404);
        }
        await ledgerAdapter.deleteTransactionLedgers({
          referenceId: invoice._id, session,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId),
        })
        res.status(200).json({
          success: true,
          message: 'Invoice deleted successfully'
        });
      })
    } catch (error) {
      next(error);
    } finally {
      await session.endSession()
    }
  };
  static checkInvoicenumberexist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { BillNumber } = req.query;
      // Validate document doesn't already exist
       await validateDocumentExistence({
        documentNumber: BillNumber as string,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId),
        documentType: 'bill',
        documentField: 'BillNumber',
        userId: req.user?._id!!
      }, Invoice);



      res.status(200).json({
        success: true,
        data: null,
        message: 'Bill number is available',
      });
    } catch (error) {
      next(error);
    }
  };
  static getInvoiceCustomersById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, invoiceNumber = "", customerId = "", fromDate = "", toDate = "", overdueOnly = "" } = req.query
      const match: Record<string, any> = {
        "summary.balanceDue": { $gt: 0 },
        companyId: new Types.ObjectId(res.locals.companyId),
      }
      if (customerId && invoiceNumber) {
        match['vendorId'] = new Types.ObjectId(customerId as string),
          match['BillNumber'] = invoiceNumber
      } else if (customerId) {
        match['vendorId'] = new Types.ObjectId(customerId as string)
      } else if (invoiceNumber) {
        match['BillNumber'] = invoiceNumber
      }

      DateTimeFilter.FilterByDate({ fromDate: fromDate as string, toDate: toDate as string, field: "dueDate", initialMatchStage: match })
      if (overdueOnly) {
        match['dueDate'] = { $lte: todayDate }
      }
      const [result] = await Invoice.aggregate([
        {
          $match: match
        },
        {
          $facet: {
            data: [
              {
                $sort: { dueDate: 1 }
              },
              ...pagination(page as string, limit as string),
              {
                $project: {
                  type: 1,
                  BillNumber: 1,
                  invoiceDate: 1,
                  dueDate: 1,
                  carrierTotal: 1,
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
                  totalDueAmount: { $sum: "$summary.balanceDue" },
                  count: { $sum: 1 }
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
      const total = result.total || 0
      const hasmore = total > Number(limit)
      res.status(200).json({
        success: true,
        data: result.data,
        totalBalance: result.total?.totalBalance || 0,
        totalRecievedAmount: result.total?.totalRecievedAmount || 0,
        totalDueAmount: result.total?.totalDueAmount || 0,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
          hasmore: hasmore
        },
      })
    } catch (error) {
      next(error);
    }
  };


  static ImportInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      const companyId = res.locals.companyId;
      const file = req.file as Express.Multer.File;

      if (!file) {
        throw new AppError("No file uploaded", 400);
      }

      const parsedData = parseCsvToJson(file, {
        companyId,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
        ownerAdminId: req.user?.ownerAdminId,
        manager: req.user?.manager,
        testing: true,
      });


      // Group rows by BillNumber
      const groupedInvoices = parsedData.reduce((acc, row) => {
        const BillNumber = row.BillNumber as string;
        if (!acc[BillNumber]) {
          acc[BillNumber] = {
            ...row,
            terms: undefined,
            expense: [],
            postingDate: row.postingDate || row.invoiceDate,
            emailStatus: row.emailStatus || 'notinitiated',
          };
        }
        if (row.productId) {
          acc[BillNumber].expense.push({
            productservice: row.productId.trim(),
            qty: row.quantity || 0,
            rate: row.price || 0,
            tax: row.tax?.trim() || null,
            amount: row.amount || 0,
          });
        }
        return acc;
      }, {} as Record<string, any>);

      const transformedData = Object.values(groupedInvoices);
      await GenerateInvoice.validateBill(transformedData, session,res.locals.companyId);


      /** ----------------- CUSTOMERS ----------------- */
      const customerIds = [...new Set(transformedData.map((item: any) => item.vendorId))];
      const customers = await Carrier.find(
        { id: { $in: customerIds }, companyId },
        { _id: 1, id: 1 }
      ).session(session);
      const customerMap = new Map(customers.map((c: any) => [c.id, c._id]));
      /** ----------------- TERMS ----------------- */
      const termsIds = [...new Set(transformedData.map((item: any) => item.terms))];
      const terms = await PaymentTerms.find(
        { name: { $in: termsIds }, companyId },
        { _id: 1, name: 1 }
      ).session(session);

      const termsMap = new Map(terms.map((c: any) => [c.name, c._id]));

      /** ----------------- PRODUCTS ----------------- */
      const productIds = [
        ...new Set(
          transformedData.flatMap((item: any) =>
            item.expense.map((exp: any) => exp.productservice)
          )
        ),
      ];

      const products = await ProductService.find(
        { name: { $in: productIds }, companyId },
        { _id: 1, name: 1 }
      ).session(session);

      // normalize product names to lowercase
      const productMap = new Map(products.map((p: any) => [p.name, p._id]));

      /** ----------------- TAXES ----------------- */
      const taxIds = [
        ...new Set(
          transformedData.flatMap((item: any) =>
            item.expense.filter((exp: any) => exp.tax).map((exp: any) => exp.tax)
          )
        ),
      ];

      const taxes = await TaxService.find(
        { label: { $in: taxIds }, companyId },
        { _id: 1, label: 1 }
      ).session(session);

      const taxMap = new Map(taxes.map((t: any) => [t.label, t._id]));

      /** ----------------- VALIDATION ----------------- */
      await duplicateProductServiceValidator("BillNumber", transformedData, parsedData, productMap, customerMap, taxMap, termsMap)

      /** ----------------- SAVE INVOICES ----------------- */
      const invoices = transformedData.map((invoice: any) => ({
        ...invoice,
        terms: invoice.terms ? termsMap.get(invoice.terms) : null,
        vendorId: customerMap.get(invoice.vendorId),
        expense: invoice.expense.map((exp: any) => ({
          ...exp,
          productservice: productMap.get(exp.productservice),
          tax: exp.tax ? taxMap.get(exp.tax) : null,
        })),
      }));

      const validateData = await Promise.all(
        invoices.map((invoice: any) => {
          console.log("invoice validate via import ",clean(invoice))
          return generateBillSchema.validate(invoice, { abortEarly: false, stripUnknown: true })
        })
      );
      const data = await GenerateInvoice.importInvoice(validateData, res, session, req);


      if (data?.invoices?.length && data.invoices.length > 0) {
        await Promise.all(data.invoices.map((item) => ledgerAdapter.recordLedgerById({
          id: item._id as unknown as Types.ObjectId,
          session: session,
          type: TransactionType.BILL,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
        })));
      }
      await session.commitTransaction();
      res.status(201).json(data);
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };
  static handleBillGeneration = async (message: any) => {
    await DocumentGenerationService.handleBillGeneration(message);
  };
}
