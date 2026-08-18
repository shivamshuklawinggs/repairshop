import { Request, Response, NextFunction } from 'express';
import Invoice, { IInvoice } from 'models/Invoice.model';
import { AppError } from 'middlewares/error';
import { generateInvoiceSchema } from './invoice.validate';
import genearatePdf from './services/genearatePdf.service';
import GenerateInvoice from './services/generateinvoice.service';
import { updateCustomerInvoice } from './services/updateinvoice.service';
import { validateDocumentExistence } from 'utils/expenseUtils';
import pagination from 'utils/pagination';
import mongoose, { PipelineStage, Types } from 'mongoose';
import Customer, { ICustomer } from 'models/Customer.model';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import ProductService from 'models/product-service.model';
import TaxService from 'models/tax.model';
import PaymentTerms from 'models/PaymentTerms.model';
import { duplicateProductServiceValidator } from 'utils/InvoiceAndBIllValdator';
import { todayDate } from 'config/constant';
import { customerPipeLine } from 'utils/transactionPipelines';
import { InvoiceResponse } from './types';
import { formatCurrency, formatDate } from 'utils';
import { parseJsonToCsv } from 'utils/parseJsonToCsv';
import { Producer } from 'config/rabbitmq/producers';;
import { TransactionType, ledgerAdapter } from 'models/Ledger.model';
import { parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import { addPaymentMetaFields, addvansePayments, buildPaymentStatusConfig, PaymentStatus } from 'services/paymentQueryBuilder';
import { mergeWithBaseFilters, TransactionFilterParams } from 'services/transactionFilters.service';
import DateTimeFilter from 'utils/postedadate';
import { LookupAliases } from 'shared/pipelines/constant';
import { producers } from 'config/bullmq';
import { getTransactionStatus } from 'microservices/transaction-services/service/utilities.service';
import DocumentGenerationService from 'services/documentGeneration.service';
export default class InvoiceController {

  static InvoicePipline = ():Array<PipelineStage.AddFields | PipelineStage.Lookup | PipelineStage.Unwind | PipelineStage.Project> => {
    return [addPaymentMetaFields(),
    addvansePayments("customer"),
    {
      $project: {
        'invoiceNumber': 1,
        'customerId': 1,
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
    ...customerPipeLine("customerId"),]
  };
  static generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      req.body = await parseCleanValidate(req.body.invoiceData, generateInvoiceSchema)
      let response: {
        success: boolean,
        message: string,
        _id: string,
        dueDate: Date
      } = {
        success: false,
        message: "",
        _id: "",
        dueDate: new Date()
      }
      response = await GenerateInvoice.generateCustomerInvoice(req, res, session);
      await ledgerAdapter.recordLedgerById({
        id: new Types.ObjectId(response._id),
        session,
        type: TransactionType.INVOICE,
        companyId: new Types.ObjectId(res.locals.companyId)
      })


      await session.commitTransaction();
      if (req.body.email && req.body.actionType && response._id) {
        response.message = await Producer.generateInvoice(response._id)
      }
      if (response._id && response.dueDate) GenerateInvoice.scheduleInvoiceReminders({ invoiceId: response._id as unknown as Types.ObjectId, dueDate: response.dueDate, companyId: new Types.ObjectId(res.locals.companyId) })
      return res.status(200).json(response);
    } catch (error) {
      await session.abortTransaction();
      next(error)
    } finally {
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
      const { customerId, page = 1, limit = 10, search, paymentStatus, emailStatus, fromDate, toDate, minAmount, maxAmount } = req.query;

      const baseMatchStage: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
      }
      if (customerId) baseMatchStage["customerId"] = customerId;

      // Apply transaction filters
      const filters: TransactionFilterParams = {
        search: search as string,
        paymentStatus: paymentStatus as PaymentStatus,
        emailStatus: emailStatus as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
        minAmount: minAmount as string,
        maxAmount: maxAmount as string,
      };

      const matchStage = mergeWithBaseFilters(baseMatchStage, filters);
      const result = await Invoice.aggregate([
        {
          $match: matchStage
        },

        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [
              ...pagination(page as string, limit as string),
             ...InvoiceController.InvoicePipline()

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
  static getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const { invoiceId } = req.params;
      const [invoice] = await Invoice.aggregate([
        { $match: { _id: new Types.ObjectId(invoiceId) } },
        addPaymentMetaFields()
      ]).limit(1)

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }
      const [summary] = await Customer.aggregate([
        {
          $match: {
            _id: invoice.customerId
          },
        },
        {
          $lookup: {
            from: LookupAliases.INVOICES,
            foreignField: "customerId",
            localField: "_id",
            pipeline: [
              {
                $group: {
                  _id: null,
                  totalInvoices: { $sum: 1 },
                  paidInvoices: {
                    $sum: {
                      $cond: [{ $eq: ["$summary.balanceDue", 0] }, 1, 0]
                    }
                  },
                  latePayments: {
                    $sum: {
                      $cond: [
                        buildPaymentStatusConfig()["overdue"].aggregationCase, // dueDate < today
                        "$summary.balanceDue",
                        0
                      ]
                    }
                  },
                  upcomingInvoices: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$summary.balanceDue", 0] },
                            { $gt: ["$dueDate", now] }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  totalAmount: { $sum: "$summary.finalAmount" },
                  totalTax: { $sum: "$summary.taxTotal" },
                  totalRecieved: { $sum: "$summary.totalRecieved" },
                  totalbalanceDue: { $sum: "$summary.balanceDue" }
                }
              }
            ],
            as: "InvoiceHistory"
          }
        },
        {
          $lookup: {
            from: "invoicereminders",
            localField: "_id",
            foreignField: "customerId",
            pipeline: [
              {
                $count: "total"
              }
            ],
            as: "invoicereminders"
          }
        },
        {
          $unwind: {
            path: "$invoicereminders",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$InvoiceHistory",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            company: 1,
            email: 1,
            phone: 1,
            createdAt: 1,
            totalInvoices: { $ifNull: ["$InvoiceHistory.totalInvoices", 0] },
            paidInvoices: { $ifNull: ["$InvoiceHistory.paidInvoices", 0] },
            latePayments: { $ifNull: ["$InvoiceHistory.latePayments", 0] },
            upcomingInvoices: { $ifNull: ["$InvoiceHistory.upcomingInvoices", 0] },
            totalAmount: { $ifNull: ["$InvoiceHistory.totalAmount", 0] },
            totalTax: { $ifNull: ["$InvoiceHistory.totalTax", 0] },
            totalRecieved: { $ifNull: ["$InvoiceHistory.totalRecieved", 0] },
            totalbalanceDue: { $ifNull: ["$InvoiceHistory.totalbalanceDue", 0] },
            totalReminders: { $ifNull: ["$invoicereminders.total", 0] }
          }
        },
      ]).limit(1)
      res.status(200).json({
        success: true,
        data: invoice,
        summary: summary
      });
    } catch (error) {
      next(error);
    }
  };
  static updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    try {
      req.body = await parseCleanValidate(req.body.invoiceData, generateInvoiceSchema)
      const newDueDate = req.body?.dueDate
        ? new Date(req.body.dueDate)
        : null;
      // Fetch full invoice before update for comparison
      const invoiceBeforeUpdate = await Invoice.findById(req.params.invoiceId).lean();
      const oldDueDate = invoiceBeforeUpdate?.dueDate
        ? new Date(invoiceBeforeUpdate.dueDate)
        : null;

      const isDueDateChanged =
        newDueDate &&
        (!oldDueDate || oldDueDate.getTime() !== newDueDate.getTime());



      let response: {
        success: boolean,
        message: string,
        _id: string;
        dueDate?: Date
      } = {
        success: false,
        message: "",
        _id: "",
        dueDate: undefined
      }
      await session.withTransaction(async () => {
        response = await updateCustomerInvoice(req, session, res);
        await ledgerAdapter.recordLedgerById({
          id: req.params.invoiceId as unknown as Types.ObjectId,
          session: session,
          type: TransactionType.INVOICE,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
        })
      });

      let invoiceId = req.params.invoiceId;
      if (req.body.email && req.body.actionType && invoiceId) {
        response.message = await Producer.generateInvoice(invoiceId)
      }
      if (response._id && newDueDate && isDueDateChanged) {
        await GenerateInvoice.scheduleInvoiceReminders({
          invoiceId: response._id as unknown as Types.ObjectId,
          dueDate: newDueDate,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
        });
      }
      // Queue invoice update notification with before and after documents
      if (response._id && invoiceBeforeUpdate) {
        const invoiceAfterUpdate = await Invoice.findById(response._id).lean();
        await Producer.invoiceUpdateNotification(
          response._id.toString(),
          res.locals.userId?.toString() || '',
          invoiceBeforeUpdate,
          invoiceAfterUpdate
        );
      }
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  };

  static deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession()
    try {
      const { invoiceId } = req.params;
      await session.withTransaction(async () => {

        const invoice = await Invoice.findByIdAndDelete(invoiceId).session(session)

        if (!invoice) {
          throw new AppError('Invoice not found', 404);
        }
        await ledgerAdapter.deleteTransactionLedgers({
          referenceId: invoice._id,
          session,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
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
      const { invoiceNumber, } = req.query;
      // Validate document doesn't already exist
       await validateDocumentExistence({
        documentNumber: invoiceNumber as string,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId),
        documentType: 'invoice',
        documentField: 'invoiceNumber',
        userId: req.user?._id!!!
      }, Invoice);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Invoice number is available',
      });
    } catch (error) {
      next(error);
    }
  };

  static getInvoiceCustomersById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const { page = 1, limit = 10, invoiceNumber = "", customerId = "", fromDate = "", toDate = "", overdueOnly = "" } = req.query
      const match: Record<string, any> = {
        companyId: new Types.ObjectId(res.locals.companyId),
        "summary.balanceDue": { $gt: 0 },
        'customerId': new Types.ObjectId(customerId as string),

      }
      if (customerId && invoiceNumber) {
        match['customerId'] = new Types.ObjectId(customerId as string),
          match['invoiceNumber'] = invoiceNumber
      } else if (customerId) {
        match['customerId'] = new Types.ObjectId(customerId as string)
      } else if (invoiceNumber) {
        match['invoiceNumber'] = invoiceNumber
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
                $project: {
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
              },

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

      // Group rows by invoiceNumber
      const groupedInvoices = parsedData.reduce((acc, row) => {
        const invoiceNumber = row.invoiceNumber as string;
        if (!acc[invoiceNumber]) {
          acc[invoiceNumber] = {
            ...row,
            terms: undefined,
            expense: [],
            postingDate: row.postingDate || row.invoiceDate,
            emailStatus: row.emailStatus || 'notinitiated',
          };
        }
        if (row.productId) {
          acc[invoiceNumber].expense.push({
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
      await GenerateInvoice.validateInvoice(transformedData, session, res.locals.companyId);
      /** ----------------- CUSTOMERS ----------------- */
      const customerIds = [...new Set(transformedData.map((item: any) => item.customerId))];
      const customers = await Customer.find(
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
      await duplicateProductServiceValidator("invoiceNumber", transformedData, parsedData, productMap, customerMap, taxMap, termsMap)


      /** ----------------- SAVE INVOICES ----------------- */
      const invoices = transformedData.map((invoice: any) => ({
        ...invoice,
        terms: invoice.terms ? termsMap.get(invoice.terms) : null,
        customerId: customerMap.get(invoice.customerId),
        expense: invoice.expense.map((exp: any) => ({
          ...exp,
          productservice: productMap.get(exp.productservice),
          tax: exp.tax ? taxMap.get(exp.tax) : null,
        })),
      }));

      const validateData = await Promise.all(
        invoices.map((invoice: any) => generateInvoiceSchema.validate(invoice, { abortEarly: false, stripUnknown: true }))
      );

      const data = await GenerateInvoice.importInvoice(validateData, res, session, req);


      if (data?.invoices?.length && data.invoices.length > 0) {
        await Promise.all(data.invoices.map((item) => ledgerAdapter.recordLedgerById({
          id: item._id as unknown as Types.ObjectId,
          session: session,
          type: TransactionType.INVOICE,
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
  /**
    * export   all invoices
    * @param req Request
    * @param res Response
    * @param next NextFunction
    */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {

      const { customerId, carrierId, startDate, endDate, page = 1, limit = 10 } = req.query;
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
      const result = await Invoice.aggregate([
        {
          $match: matchStage
        },

        { $sort: { createdAt: -1 } },
        ...pagination(page as string, limit as string),
        ...InvoiceController.InvoicePipline()
      ])
      // Ensure result is not empty and extract data correctly

      if (result.length === 0) throw new AppError("No data found to export", 404)
      // }
      // Define the fields for the CSV
      const fields = [
        { value: "invoiceNumber", label: "Invoice Number" },
        { value: "customer", label: "Customer" },
        { value: "status", label: "Status" },
        { value: "invoiceDate", label: "Invoice Date" },
        { value: "dueDate", label: "Due Date" },
        { value: "totalAmountWithTax", label: "Total Amount" },
        { value: "recievedAmount", label: "Received Amount" },
        { value: "balanceDue", label: "Due Amount" },
      ]
      const trandformdata = result.map((invoice: InvoiceResponse) => {
        return {
          invoiceNumber: invoice.invoiceNumber,
          customer: invoice.customer?.company || "",
          status: getTransactionStatus({
            credits: 0,
            type: TransactionType.INVOICE,
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
      const base64 = await parseJsonToCsv(trandformdata, fields)


      res.status(200).json({
        success: true, statusCode: 200,
        data: {
          filename: 'invoice.csv',
          mimeType: 'text/csv',
          base64: base64
        }
      });
    } catch (error) {
      next(error)
    }
  }
  /**
   * @description handle Invoice genearation via rabitmq
   * @type GET 
   * @path /api/invoices/export
   */
  static handleInvoiceGeneration = async (message: any) => {
    await DocumentGenerationService.handleInvoiceGeneration(message);
  };

  static sendInvoiceReminderManually = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceNumber, cc, bcc, sendMeCopy, to } = req.body;

      if (!invoiceNumber) {
        throw new AppError('Invoice Number is required', 400);
      }


      // Fetch invoice with customer and company details
      const [invoice] = await Invoice.aggregate<IInvoice & { customer: ICustomer }>([
        {
          $match: {
            invoiceNumber,
            companyId: new Types.ObjectId(res.locals.companyId),
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },

        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true
          }
        },
      ]);

      if (!invoice) {
        throw new AppError('Invoice not found or has no balance due', 404);
      }
      if (invoice.summary && invoice?.summary?.balanceDue <= 0) {
        throw new AppError("Invoice Is Already Paid", 400)
      }

      const customerEmail = to || invoice.email || invoice.customer?.email;
      if (!customerEmail) {
        throw new AppError('No email address is associated with this invoice. Please update the invoice with a valid customer email address.', 400);
      }
      // Build recipient list
      const toEmail = customerEmail;
      const ccList = cc ? (Array.isArray(cc) ? cc : cc.split(',').map((e: string) => e.trim())) : [];
      const bccList = bcc ? (Array.isArray(bcc) ? bcc : bcc.split(',').map((e: string) => e.trim())) : [];
      // Add company email to CC/BCC if sendMeCopy is checked
      if (sendMeCopy && req.user?.email) {
        bccList.push(req.user?.email);
      }
      await producers.invoice.sendManualReminder({ invoiceId: invoice._id, toEmail, ccList, bccList },)
      res.status(200).json({
        success: true,
        message: 'Reminder sent successfully',
        statusCode: 200
      });
    } catch (error) {
      next(error);
    }
  };
}
