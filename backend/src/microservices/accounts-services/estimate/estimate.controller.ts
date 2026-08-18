import { Request, Response, NextFunction } from 'express';
import Invoice from 'models/estimate.model';
import { AppError } from 'middlewares/error';
import { generateInvoiceSchema } from './estimate.validate';
import genearatePdf from './services/genearatePdf.service';
import GenerateInvoice from './services/generate.estimate.service';
import { updateCustomerInvoice } from './services/update.estimate.service';
import pagination from 'utils/pagination';
import mongoose, { Types } from 'mongoose';
import InvoiceModal from 'models/Invoice.model';
import EstimateModal from 'models/estimate.model';
import { parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import { TransactionType, ledgerAdapter } from 'models/Ledger.model';
import { updateProductService } from 'microservices/products-services/product.service';
import { customerPipeLine } from 'utils/transactionPipelines';
import { addPaymentMetaFields, PaymentStatus } from 'services/paymentQueryBuilder';
import { mergeWithBaseFilters, TransactionFilterParams } from 'services/transactionFilters.service';
import { Producer } from 'config/rabbitmq/producers';
import DocumentGenerationService from 'services/documentGeneration.service';
export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const type = req.params.type;
    req.body = await parseCleanValidate(req.body.invoiceData, generateInvoiceSchema);
    const { invoiceNumber } = req.body;
    const invoice = await InvoiceModal.findOne({ invoiceNumber, type, companyId: res.locals.companyId }).session(session)
    if (invoice) {
      throw new AppError('Invoice number already exists', 400);
    }
    const estimate = await EstimateModal.findOne({ invoiceNumber, type, companyId: res.locals.companyId }).session(session);
    if (estimate) {
      throw new AppError('Estimate number already exists', 400);
    }
    let response: any = {
      success: false,
      message: ""
    }

    response = await GenerateInvoice.generateCustomerInvoice(req, res, session);

    if (req.body.email && req.body.actionType) {
       response.message = await Producer.generateEstimate(response._id)
    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Estimate generated successfully"
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};



export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, page = 1, limit = 10, search, paymentStatus, fromDate, toDate, minAmount, maxAmount } = req.query;
    
    const baseMatchStage: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId),
    }
    if (customerId) baseMatchStage["customerId"] = customerId;
    
    // Apply transaction filters
    const filters: TransactionFilterParams = {
      search: search as string,
      paymentStatus: paymentStatus as PaymentStatus,
      fromDate: fromDate as string,
      toDate: toDate as string,
      minAmount: minAmount as string,
      maxAmount: maxAmount as string,
    };
    
    const matchStage = mergeWithBaseFilters(baseMatchStage, filters);
    const result = await EstimateModal.aggregate([
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
            addPaymentMetaFields(),
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
                emailStatus:1
              }
            },
            ...customerPipeLine("customerId"),
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

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    req.body = await parseCleanValidate(req.body.invoiceData, generateInvoiceSchema);
    let response: any = {
      success: false,
      message: ""
    }
    response = await updateCustomerInvoice(req, res, session)
    let invoiceId = req.params.invoiceId;
    if (req.body.email && req.body.actionType) {
      response.message = await Producer.generateEstimate(invoiceId)
    }
    await session.commitTransaction();

    return res.status(200).json(response);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};
export const deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findByIdAndDelete(invoiceId);

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
export const createInvoiceByEstimateId = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const { estimateId } = req.params;
    let estimate = await EstimateModal.findByIdAndDelete(estimateId).session(session);
    if (!estimate) {
      throw new AppError('Estimate not found', 404);
    }
    estimate = estimate.toObject()
    const invoiceData = {
      ...estimate,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
      ownerAdminId: req.user?.ownerAdminId,
      manager: req.user?.manager
    }
    const invoice = new InvoiceModal(invoiceData)
    await updateProductService(invoiceData.expense || [], [], false, session, "invoice", res,req)
    await invoice.save({ session })
    await ledgerAdapter.recordLedgerById({
      id: invoice._id,
      session: session,
      type: TransactionType.INVOICE,
      companyId: new mongoose.Types.ObjectId(res.locals.companyId)
    })
    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
}
export const AcceptEstimate = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const { estimateId } = req.params;
    const estimate = await EstimateModal.findOneAndUpdate({ _id: estimateId, companyId: res.locals.companyId }, { accepted: true }).session(session);
    if (!estimate) {
      throw new AppError('Estimate not found', 400);
    }
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: estimate,
    })
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
}
export const generatePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const { isPdf = "true" } = req.query
    const data = await genearatePdf.generatePdfData(req.params.invoiceId, session)
    await session.commitTransaction();
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
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};
export const handleEstimateGeneration = async (message: any) => {
    await DocumentGenerationService.handleEstimateGeneration(message);
  };



