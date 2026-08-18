import { Request, Response, NextFunction } from "express";
import { AppError } from "middlewares/error";
import mongoose, { Document, Types } from "mongoose";
import PaymentModal, { IPayment, PaymentType } from "models/payment.model";
import { getInvoiceBillPipeline } from "./service/Payment.Customer.Pipeline.service";
import { createBillPayment } from "./service/payment.create.bill";
import { createInvoicePayment } from "./service/payment.create.invoice";
import { updateBillPayment } from "./service/payment.update.bill";
import { updateInvoicePayment } from "./service/payment.update.invoice";
import { todayDate } from "config/constant";
import DateTimeFilter from "utils/postedadate";
import { PaymentsCustomerPipeLine } from "shared/pipelines/BaseLookups/BasePipelines";
import pagination from "utils/pagination";
import { TransactionType, ledgerAdapter } from "models/Ledger.model";
import { UpdateRecievedPamentSchemaType } from "./payment.validate";
import { producers } from "config/bullmq";
import { paymentDelete } from "./service/payment.delete.service";

export default class PaymentController {
  static createPayments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      const {
        invoicePayments,
        amount = 0,
        paymentDate,
        paymentMethod,
        referenceNo,
        depositTo,
        customerId,
      } = req.body;
      const type = req.query.type as PaymentType;
      if (!type) {
        throw new AppError("Type is required", 400);
      }
      if (type !== "invoice" && type !== "bill") {
        throw new AppError("Invalid type", 400);
      }
      if (!referenceNo) {
        throw new AppError("Reference number is required", 400);
      }

      // 2️⃣ Prepare payload
      let payload: Omit<IPayment, keyof Document> = {
        // invoiceIds: invoicePayments.map((p: { invoiceId: Types.ObjectId }) => p.invoiceId),
        status: "Unsettled",
        billids: [],
        invoiceIds: [],
        PaymentType: type as PaymentType,
        postingDate: new Date(req.body.postingDate),
        amount: amount,
        credits: amount,
        settledAmount: 0,
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod,
        referenceNo: referenceNo?.toLowerCase(),
        depositTo: depositTo,
        customerId: customerId,
        companyId: res.locals.companyId as unknown as mongoose.Types.ObjectId,
        createdBy: req.user?._id as unknown as mongoose.Types.ObjectId,
        updatedBy: req.user?._id as unknown as mongoose.Types.ObjectId,
        ownerAdminId: req.user?.ownerAdminId as mongoose.Types.ObjectId,
        manager: req.user?.manager as mongoose.Types.ObjectId,
      };
      // 3️⃣ Create payment
      const [payment] = await PaymentModal.create([payload], { session });

      if (!payment) {
        throw new AppError("Failed to create payment", 500);
      }
      if (type == "invoice") {
        payment.invoiceIds = await createInvoicePayment({
          invoicePayments,
          payment,
          session,
          req,
          res,
        });
      } else if (type == "bill") {
        payment.billids = await createBillPayment({
          invoicePayments,
          payment,
          session,
          req,
          res,
        });
      }

      // 5️⃣ Save payment after invoices updated
      await payment.save({ session });
      await ledgerAdapter.recordLedgerById({
        id: payment._id,
        session: session,
        type: TransactionType.PAYMENT,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId),
      });
      if (payment.billids.length > 0) {
        await Promise.all(
          payment.billids.map((item) =>
            ledgerAdapter.recordLedgerById({
              id: item,
              session: session,
              type: TransactionType.BILL,
              companyId: new mongoose.Types.ObjectId(res.locals.companyId),
            }),
          ),
        );
      }
      if (payment.invoiceIds.length > 0) {
        await Promise.all(
          payment.invoiceIds.map((item) => // ✅ FIXED
            ledgerAdapter.recordLedgerById({
              id: item,
              session,
              type: TransactionType.INVOICE,
              companyId: new mongoose.Types.ObjectId(res.locals.companyId),
            })
          )
        );
      }
      await session.commitTransaction();
      if (payment.PaymentType === PaymentType.invoice) {
        producers.rating.customerRated({
          customerId: payment.customerId,
        });
      }
      res.status(200).json({
        success: true,
        message: "Payments created successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };

  static getPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const type = req.query.type as PaymentType;
      if (!type) {
        throw new AppError("Type is required", 400);
      }
      if (type != "invoice" && type != "bill") {
        throw new AppError("Invalid type", 400);
      }
      const {
        invoiceNumber = "",
        fromDate = "",
        toDate = "",
        overdueOnly = "",
      } = req.query;
      const { id } = req.params;
      const match: Record<string, any> = {};
      if (invoiceNumber) {
        match["invoiceNumber"] = invoiceNumber;
      }
      DateTimeFilter.FilterByDate({
        fromDate: fromDate as string,
        toDate: toDate as string,
        field: "dueDate",
        initialMatchStage: match,
      });
      if (overdueOnly) {
        match["dueDate"] = { $lte: todayDate };
      }
      const pipeline = getInvoiceBillPipeline(type, match, id);

      const [payment] = await PaymentModal.aggregate(pipeline).limit(1);
      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  };
  static getAllPayments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = "", 
        paymentType = "",
        status = "",
        paymentMethod = "",
        customerId = "",
        depositTo = "",minAmount="",maxAmount=""
      } = req.query;
      const { initalMatchStage } = DateTimeFilter.FilterByDate({
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        field: "paymentDate",
        initialMatchStage: {
          companyId: new mongoose.Types.ObjectId(res.locals.companyId),
        },
      });
      
      // Add search filter
      if (typeof search === "string" && search) {
        let trimedSearch = search.trim()
        initalMatchStage["$or"] = [
          {referenceNo:trimedSearch},
          {paymentMethod:trimedSearch},
        ]
      }
      
      // Add payment type filter
      if (paymentType && typeof paymentType === "string") {
        initalMatchStage["PaymentType"] = paymentType;
      }
      
      // Add status filter
      if (status && typeof status === "string") {
        initalMatchStage["status"] = status;
      }
      
      // Add payment method filter
      if (paymentMethod && typeof paymentMethod === "string") {
        initalMatchStage["paymentMethod"] = paymentMethod;
      }
      // Amount range filter
      if (minAmount || maxAmount) {
        const amountFilter: Record<string, any> = {};
        if (minAmount) {
          amountFilter.$gte = parseFloat(minAmount as string);
        }
        if (maxAmount) {
          amountFilter.$lte = parseFloat(maxAmount as string);
        }
        initalMatchStage['amount'] = amountFilter;
      }
      
      // Add customer filter
      if (customerId && typeof customerId === "string") {
        initalMatchStage["customerId"] = new mongoose.Types.ObjectId(customerId);
      }
      
      // Add deposit account filter
      if (depositTo && typeof depositTo === "string") {
        initalMatchStage["depositTo"] = new mongoose.Types.ObjectId(depositTo);
      }
      const [payment] = await PaymentModal.aggregate([
        {
          $match: initalMatchStage,
        },
        {
          $sort: {
            paymentDate: -1,
            settledAmount:-1
          },
        },
        {
          $facet: {
            data: [
              ...pagination(
                parseInt(page as string),
                parseInt(limit as string),
              ),
              ...PaymentsCustomerPipeLine(),
              {
                $lookup:{
                  from:"chartofaccounts",
                  localField:"depositTo",
                  foreignField:"_id",
                  pipeline:[
                    {
                      $project:{
                        name:1
                      }
                    }
                  ],
                  as:"DespositeAccount"
                }
              },
              {
                $unwind:{
                  preserveNullAndEmptyArrays:true,
                  path:"$DespositeAccount"
                }
              },
              {
                $addFields: {
                  type: {
                    $cond: [
                      { $eq: ["$PaymentType", "invoice"] },
                      "Invoice",
                      {
                        $cond: [
                          { $eq: ["$PaymentType", "bill"] },
                          "Bill",
                          "Unsettled",
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            total: [
              {
                $count: "total",
              },
            ],
          },
        },
        {
          $project: {
            data: 1,
            total: {
              $arrayElemAt: ["$total.total", 0],
            },
          },
        },
      ]);
      res.status(200).json({
        data: payment.data || [],
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: payment.total || 0,
      });
    } catch (error) {
      next(error);
    }
  };

  static updatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const session = await mongoose.startSession();
    try {
      await session.startTransaction();

      const { id } = req.params;
      const payload = req.body as UpdateRecievedPamentSchemaType;

      const type = req.query.type as PaymentType;
      if (!type) throw new AppError("Type is required", 400);
      if (type !== "invoice" && type !== "bill")
        throw new AppError("Invalid type", 400);

      if (type === "invoice") {
        await updateInvoicePayment({
          res,
          id,
          payload,
          reqBody: payload,
          session,
          req,
        });
      } else if (type === "bill") {
        await updateBillPayment({
          res,
          id,
          payload,
          reqBody: req.body,
          session,
          req,
        });
      }

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };
  static deletePayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      const { id } = req.params;

      await paymentDelete({ res, id, session });
      await ledgerAdapter.deleteTransactionLedgers({
        referenceId: id as unknown as Types.ObjectId,
        session,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId),
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: "Payment deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };
}
