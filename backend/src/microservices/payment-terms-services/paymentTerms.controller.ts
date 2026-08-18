import { Request, Response, NextFunction } from 'express';
import PaymentTerms, { IPaymentTerms } from '../../models/PaymentTerms.model';
import { AppError } from 'middlewares/error';
import mongoose, { Types } from 'mongoose';
import refExist from 'utils/refExist';
import { parseCsvToJson } from 'utils/parseCsvToJson';

/**
 * @description Create a new payment term
 * @type POST
 * @path /api/payment-terms
 */
const createPaymentTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session=await mongoose.startSession()
  await session.startTransaction();
  try {
    req.body.createdBy = req.user?._id;
    req.body.updatedBy = req.user?._id;
    req.body.companyId=res.locals.companyId
    req.body.manager=req.user?.manager
    req.body.ownerAdminId=req.user?.ownerAdminId
    const [paymentTerm] = await PaymentTerms.create([req.body],{session})
  
    await session.commitTransaction()
    res.status(201).json({ data: paymentTerm, success: true, statusCode: 201 });
  } catch (error) {
    await session.abortTransaction()
    next(error);
  } finally{
      await session.endSession();
    }
};

/**
 * @description Get all payment terms
 * @type GET
 * @path /api/payment-terms
 */
const getAllPaymentTerms = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let query={
      companyId: new Types.ObjectId(res.locals.companyId),
    }
    let paymentTerms:IPaymentTerms[]=[]

      /**
       * if customer id is not provided then get payment terms from payment terms collection
       */
      paymentTerms = await PaymentTerms.aggregate([
       {
        $match:query
       }
      ]).sort({ "days": 1 });
    
    res.status(200).json({ data: paymentTerms, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update a payment term
 * @type PUT
 * @path /api/payment-terms/:id
 */
const updatePaymentTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session=await mongoose.startSession()
  await session.startTransaction();
  try {
    req.body.updatedBy = req.user?._id;
        const updated = await PaymentTerms.findOneAndUpdate(
      { _id: req.params.id ,companyId:res.locals.companyId },
      req.body,
      { new: true }
    ).session(session)
  
    if (!updated) {
      throw new AppError('Payment term not found', 404);
    }
    await session.commitTransaction()
    res.status(200).json({ data: updated, success: true, statusCode: 200 });
  } catch (error) {
    await session.abortTransaction()
    next(error);
  } finally{
      await session.endSession();
    }
};

/**
 * @description Delete a payment term
 * @type DELETE
 * @path /api/payment-terms/:id
 */
const deletePaymentTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session=await mongoose.startSession()
  await session.startTransaction();
  try {
    await refExist("Customer",req.params.id,"paymentTerms",session)
    const deleted = await PaymentTerms.findOneAndDelete(
      { _id: req.params.id, createdBy: req.user?._id},
    ).session(
      session
    )
    if (!deleted) {
      throw new AppError('Payment term not found', 404);
    }
    await session.commitTransaction()
    
    res.status(200).json({ success: true, statusCode: 200 });
  } catch (error) {
    await session.abortTransaction()
    next(error);
  } finally{
      await session.endSession();
    }
};
const getPaymentTermById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paymentTerm = await PaymentTerms.findById(req.params.id);
    res.status(200).json({ data: paymentTerm, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
const importPaymentTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const companyId = res.locals.companyId;
    const file = req.file as Express.Multer.File;
    if (!file) throw new AppError('No file uploaded', 400);

    const parsedData = parseCsvToJson(file, {
      companyId,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
      ownerAdminId: req.user?.ownerAdminId,
      manager: req.user?.manager,
    });

    /** ---- Duplicate name check ---- */
    const incomingNames = parsedData.map((r: any) => r.name?.trim()).filter(Boolean);
    const existing = await PaymentTerms.find(
      { name: { $in: incomingNames }, companyId },
      { name: 1 }
    ).session(session);
    if (existing.length > 0) {
      throw new AppError(`The following payment terms already exist: ${existing.map((t: any) => t.name).join(', ')}`, 400);
    }

    /** ---- Save records ---- */
    const records: IPaymentTerms[] = [];
    for (const row of parsedData) {
      const doc = new PaymentTerms({ ...row, name: row.name?.trim() });
      await doc.validate();
      await doc.save({ session });
      records.push(doc);
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, statusCode: 201, data: records });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};

export {
  createPaymentTerm,
  getAllPaymentTerms,
  updatePaymentTerm,
  deletePaymentTerm,
  getPaymentTermById,
  importPaymentTerms
}; 