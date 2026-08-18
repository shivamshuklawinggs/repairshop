import { Request, Response, NextFunction } from 'express';
import ItemService, { companyType, ICompany } from 'models/company.model';
import { AppError } from 'middlewares/error';
import { getServicesByCreatedBy } from 'utils/CreatedBy.Pipeline.Service';
import { Role } from 'microservices/auth-service/types';
import User from 'models/user.model';
import fs from 'fs';
import mongoose from 'mongoose';
import { cacheWrapper } from 'config/redis/cacheWrapper';
import redisService from 'config/redis/redisService';
import { seedChartOfAccounts } from 'seeders/seedChartOfAccounts';
import Invoice from 'models/Invoice.model';
import Bill from 'models/Bill.model';
import Customer from 'models/Customer.model';
import Carrier from 'models/Carrier.model';
import Payment from 'models/payment.model';
import PaymentTerms from 'models/PaymentTerms.model';
import TaxService from 'models/tax.model';
import ProductService from 'models/product-service.model';
import ChartOfAccount from 'models/chartOfAccounts.model';
import  { LedgerTransactionModel } from 'models/Ledger.model';
import JournalEntry from 'models/journal-entry.model';
import Estimate from 'models/estimate.model';
import PaymentAllocation from 'models/PaymentAllocation.model';
import Statement from 'models/statement.model';
import { InvoiceReminder } from 'models/IInvoiceReminder.model';
const models = [
  Invoice,
  Bill,
  Customer,
  Carrier,
  Payment,
  PaymentTerms,
  TaxService,
  ProductService,
  ChartOfAccount,
  LedgerTransactionModel,
  JournalEntry,
  Estimate,
  PaymentAllocation,
  Statement,
  InvoiceReminder,
];
export const getCompanyType=async(companyId:string):Promise<companyType | undefined>=>{
  const cacheKey = `company-${companyId}`;
       const userCompanyType = await cacheWrapper(
         { key: cacheKey,ttlSeconds:36000 },
         async () => {
           return await ItemService.findById(companyId).select("type -_id").lean().then(data => data?.type)
         }
       );
       if(userCompanyType) return userCompanyType
       return undefined
       
}
/**
 * @description Create a new item service
 * @type POST
 * @path /api/item-services
 */
const createCompanyService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    req.body.createdBy = req.user?._id;
    req.body.updatedBy = req.user?._id;
    req.body.manager=req.user?.manager
    req.body.ownerAdminId=req.user?.ownerAdminId
    req.body.logo = req.file
    
    // Handle contact details structure
    if (req.body.physicalDetails) {
      req.body.physicalDetails = JSON.parse(req.body.physicalDetails);
    }
    if (req.body.billingDetails) {
      req.body.billingDetails = JSON.parse(req.body.billingDetails);
    }
    
    let itemService: ICompany | null = null
    await session.withTransaction(async () => {
      [itemService] = await ItemService.create([req.body], { session });
      await seedChartOfAccounts({ companyId: itemService._id, userId: req.user?._id!!!, session: session,})
    })

    res.status(201).json({ data: itemService, success: true, statusCode: 201, message: "Company Created Successfully" });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
    await redisService.deleteMatchingKeys('company-*')
  }
};

/**
 * @description Get all item services
 * @type GET
 * @path /api/item-services
 */
const getAllCompanyServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const currentRole = req.user?.role;

    // Create a unique cache key per user + role
    const cacheKey = `company-list-${userId}-${currentRole}`;

    const itemServices = await cacheWrapper(
      { key: cacheKey },
      async () => {
        const query = {};

        if (
          currentRole === Role.MANAGER ||
          currentRole === Role.ACCOUNTANT
        ) {
          const data = await User.findById(userId)
            .populate<{ visibleCompany: ICompany[] }>("visibleCompany")
            .select("visibleCompany -_id");

          return (data?.visibleCompany as unknown as ICompany[]) || [];
        } else {
          return await ItemService.aggregate([
            { $match: query },
            ...getServicesByCreatedBy({ req, matchStage: query }).slice(1),
          ]);
        }
      }
    );

    res.status(200).json({
      data: itemServices,
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get an item service by ID
 * @type GET
 * @path /api/item-services/:id
 */
const getCompanyServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemService =
      await cacheWrapper({ key: `company-details-${req.params.id}`, }, async () => {
        return await ItemService.findById(req.params.id)
      })
    if (itemService) {
      res.status(200).json({ data: itemService, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 400);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update an item service by ID
 * @type PUT
 * @path /api/item-services/:id
 */
const updateCompanyService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.body.updatedBy = req.user?._id;
    const itemService = await ItemService.findById(req.params.id);
    if (!itemService) {
      throw new AppError('Item Service not found', 404);
    }

    const updates = { ...req.body };
    delete (updates as any)._id;

    // Handle contact details structure
    if (updates.physicalDetails && typeof updates.physicalDetails === 'string') {
      updates.physicalDetails = JSON.parse(updates.physicalDetails);
    }
    if (updates.billingDetails && typeof updates.billingDetails === 'string') {
      updates.billingDetails = JSON.parse(updates.billingDetails);
    }

    Object.keys(updates).forEach((key) => {
      (itemService as any)[key] = (updates as any)[key];
    });

    if (req.file) {
      const existingLogoPath = (itemService as any).logo?.path;
      if (existingLogoPath && fs.existsSync(existingLogoPath)) {
        fs.unlinkSync(existingLogoPath);
      }
      (itemService as any).logo = req.file;
    }

    await itemService.save();
    await redisService.deleteMatchingKeys('company-*')
    res.status(200).json({ data: itemService, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete an item service by ID
 * @type DELETE
 * @path /api/item-services/:id
 */
const deleteCompanyService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const documentId = new mongoose.Types.ObjectId(req.params.id);

    // Find company first to get stored file paths
    const company = await ItemService.findById(documentId).session(session).lean()
    if (!company) throw new AppError('Company not found', 404);
    if (company.test) {
      throw new AppError('Test companies cannot be deleted', 400);
    }
    if(company._id.toString() ===res.locals.companyId.toString()){
      throw new AppError('You cant delete Selected Company', 400);
    }
    const companyId = documentId;

    // Cascade delete all related documents
    await Promise.all(
      models.map((model) =>
        model.collection.deleteMany(
          { companyId },
          { session }
        )
      )
    );

    // Delete the company itself
    await ItemService.deleteOne(
      { _id: documentId },
      { session }
    );
    await session.commitTransaction();

    // Delete stored files (logo) after successful transaction
    const logoPath = company.logo?.path;
    if (logoPath && fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    res.status(200).json({ success: true, statusCode: 200, message: "Company and all related data deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
    await redisService.deleteMatchingKeys('company-*');
  }
};

export { createCompanyService, getAllCompanyServices, getCompanyServiceById, updateCompanyService, deleteCompanyService };
