import { Request, Response, NextFunction } from 'express';
import ItemService from 'models/tax.model';
import { AppError } from 'middlewares/error';
import mongoose, { Types } from 'mongoose';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import ChartOfAccount from 'models/chartOfAccounts.model';
import { defaultChartsDetailTypeidIdsEnum } from 'microservices/chart-accounts-services/services/Accounttypes.service';
/**
 * @description Create a new item service
 * @type POST
 * @path /api/item-services
 */
const createItemService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.body.createdBy = req.user?._id;
    req.body.updatedBy = req.user?._id;
    req.body.companyId = res.locals.companyId
    req.body.manager = req.user?.manager
    req.body.ownerAdminId = req.user?.ownerAdminId
    const itemService = await ItemService.create(req.body);
    res.status(201).json({ data: itemService, success: true, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get all item services
 * @type GET
 * @path /api/item-services
 */
const getAllItemServices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId),
    }
    const itemServices = await ItemService.aggregate([
      {
        $match: query
      }
    ])
    res.status(200).json({ data: itemServices, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get an item service by ID
 * @type GET
 * @path /api/item-services/:id
 */
const getItemServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemService = await ItemService.findById(req.params.id);
    if (itemService) {
      res.status(200).json({ data: itemService, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 404);
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
const updateItemService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.body.updatedBy = req.user?._id;
    const updated = await ItemService.findOneAndUpdate({ _id: req.params.id, companyId: res.locals.companyId }, req.body, { new: true, runValidators: true });
    if (!updated) {
      throw new AppError('Item Service not found', 404);
    }
    res.status(200).json({ data: updated, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete an item service by ID
 * @type DELETE
 * @path /api/item-services/:id
 */
const deleteItemService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await ItemService.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.status(204).json({ success: true, statusCode: 204 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get all chartofAccount Taxes 
 * @type GET
 * @path /api/SalesTax
 */
const SalesTax = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const data = await ItemService.aggregate([
      {
        $match: {
          ChartOfAccountId: { $exists: true },
          companyId: new Types.ObjectId(res.locals.companyId),
        }
      },
      {
        $lookup: {
          from: "chartofaccounts",
          localField: "ChartOfAccountId",
          pipeline: [
            {
              $match: {
                "detailTypeData.detailType": defaultChartsDetailTypeidIdsEnum.SALES_TAX_PAYABLE
              }
            }
          ],
          foreignField: "_id",
          as: "chartofaccounts"
        }
      },
      {
        $match: {
          chartofaccounts: {
            $elemMatch: {
              "type": "liability"
            }
          }
        }
      },
      {
        $unset: ["chartofaccounts"]
      }
    ])
    res.status(200).json({
      data: data,
      success: true,
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @description Get all chartofAccount Taxes 
 * @type GET
 * @path /api/PurchaseTax
 */
const PurchaseTax = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const data = await ItemService.aggregate([
      {
        $match: {
          ChartOfAccountId: { $exists: true },
          companyId: new Types.ObjectId(res.locals.companyId),
        }
      },
      {
        $lookup: {
          from: "chartofaccounts",
          localField: "ChartOfAccountId",
          pipeline: [
            {
              $match: {
                "detailTypeData.detailType": defaultChartsDetailTypeidIdsEnum.PURCHASE_TAX
              }
            }
          ],
          foreignField: "_id",
          as: "chartofaccounts"
        }
      },
      {
        $match: {
          chartofaccounts: {
            $elemMatch: {
              "type": "liability"
            }
          }
        }
      },
      {
        $unset: ["chartofaccounts"]
      }
    ])
    res.status(200).json({
      data: data,
      success: true,
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};

const importTaxOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    /** ---- Resolve ChartOfAccountId by account name ---- */
    const accountNames = [...new Set(parsedData.map((r: any) => r.ChartOfAccountId?.trim()).filter(Boolean))] as string[];
    const accounts = await ChartOfAccount.find(
      { name: { $in: accountNames }, companyId },
      { _id: 1, name: 1 }
    ).session(session);
    const accountMap = new Map(accounts.map((a: any) => [a.name.toLowerCase(), a._id]));

    const missingAccounts = accountNames.filter(n => !accountMap.has(n.toLowerCase()));
    if (missingAccounts.length > 0) {
      throw new AppError(`The following accounts were not found: ${missingAccounts.join(', ')}`, 400);
    }

    /** ---- Duplicate label check ---- */
    const incomingLabels = parsedData.map((r: any) => r.label?.trim().toLowerCase()).filter(Boolean);
    const existing = await ItemService.find(
      { label: { $in: incomingLabels }, companyId },
      { label: 1 }
    ).session(session);
    if (existing.length > 0) {
      throw new AppError(`The following tax labels already exist: ${existing.map((t: any) => t.label).join(', ')}`, 400);
    }

    /** ---- Save records ---- */
    const taxes = [];
    for (const row of parsedData) {
      const doc = new ItemService({
        ...row,
        label: row.label?.trim(),
        ChartOfAccountId: accountMap.get(row.ChartOfAccountId?.trim().toLowerCase()),
      });
      await doc.validate();
      await doc.save({ session });
      taxes.push(doc);
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, statusCode: 201, data: taxes });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};

export { createItemService, getAllItemServices, getItemServiceById, updateItemService, deleteItemService, SalesTax, PurchaseTax, importTaxOptions };
