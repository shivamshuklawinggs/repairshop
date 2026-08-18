import { Request, Response, NextFunction } from 'express';
import ItemService, { IProductService } from 'models/product-service.model';
import { AppError } from 'middlewares/error';
import mongoose, { PipelineStage, Types } from 'mongoose';
import { generateUniqueId } from 'models/universalid.model';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import ChartOfAccount from 'models/chartOfAccounts.model';
import companyModel from 'models/company.model';
/**
 * @description Create a new item service
 * @type POST
 * @path /api/item-services
 */
const createItemService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    req.body.createdBy = req.user?._id;
    req.body.updatedBy = req.user?._id;
    req.body.companyId = res.locals.companyId
    req.body.manager=req.user?.manager
    req.body.ownerAdminId=req.user?.ownerAdminId
    req.body.id = await generateUniqueId({prefix:"PS-", session,companyId:res.locals.companyId as unknown as Types.ObjectId})
    const [itemService] = await ItemService.create([req.body], { session });
    await session.commitTransaction();
    res.status(201).json({ data: itemService, success: true, statusCode: 201 });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally{
      await session.endSession();
    }
};

/**
 * @description Get all item services
 * @type GET
 * @path /api/item-services
 */
const getAllItemServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const {
  page,
  limit,
  search,
} = req.query as {
  page?: string;
  limit?: string;
  search?: string;
};

const pageNumber = Math.max(Number(page) || 1, 1);
const limitNumber = Math.max(Number(limit) || 10, 1);
const isPagination = !!page;

const skip = (pageNumber - 1) * limitNumber;

const query: Record<string, any> = {
  companyId: new Types.ObjectId(res.locals.companyId),
  ...(isPagination && { isLoad: false }),
};

// Optional search
if (search?.trim()) {
  query.name = {
    $regex: search.trim(),
    $options: "i",
  };
}
const companyDetails=await companyModel.findById(res.locals.companyId).select("type").lean()
if(companyDetails && companyDetails.type==="REPAIR"){
  query.isLoad= false
}
const accountLookups: Array<PipelineStage.Lookup |PipelineStage.Unwind > = [
  {
    $lookup: {
      from: "chartofaccounts",
      localField: "expenseAccount",
      foreignField: "_id",
      as: "expenseAccountData",
    },
  },
  {
    $lookup: {
      from: "chartofaccounts",
      localField: "incomeAccount",
      foreignField: "_id",
      as: "incomeAccountData",
    },
  },
  {
    $lookup: {
      from: "chartofaccounts",
      localField: "inventoryAccount",
      foreignField: "_id",
      as: "inventoryAccountData",
    },
  },
  {
    $unwind: {
      path: "$expenseAccountData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $unwind: {
      path: "$incomeAccountData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $unwind: {
      path: "$inventoryAccountData",
      preserveNullAndEmptyArrays: true,
    },
  },
];

const pipeline: PipelineStage[] = [
  {
    $match: query,
  },
  {
    $sort: {
      createdAt: -1,
    },
  },

  ...(isPagination
    ? [
        {
          $facet: {
            data: [
              {
                $skip: skip,
              },
              {
                $limit: limitNumber,
              },
              ...accountLookups,
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
              $ifNull: [
                {
                  $arrayElemAt: ["$total.total", 0],
                },
                0,
              ],
            },
          },
        },
      ]
    : accountLookups),
];

const itemServices = await ItemService.aggregate(pipeline);

const responseData = isPagination
  ? itemServices?.[0]?.data || []
  : itemServices;

const total = isPagination
  ? itemServices?.[0]?.total || 0
  : responseData.length;

const pagination = isPagination
  ? {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    }
  : null;
    res.status(200).json({
      data: responseData, success: true, statusCode: 200,
      pagination,total
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
  const session=await mongoose.startSession()
  try {
    await session.startTransaction()
    const payload: Partial<IProductService> = req.body;
    req.body.updatedBy = req.user?._id;

    const updated = await ItemService.findOne({ _id: req.params.id }).session(session);
    if (!updated) throw new AppError("Item Service not found", 404);

    let updates: Partial<IProductService> = {};

    // If category switched to inventory
    if (payload.category === "inventory" && updated.category !== "inventory") {
      updated.currentLevel = (updated.currentLevel || 0) + (updated.OpeningStock > 0 ? 0 : payload.OpeningStock || 0);
      // exclude inventory-only fields from overwriting currentLevel
      const { currentLevel, ...rest } = payload;
      updates = rest;
    }
    // If category is not inventory
    else if (payload.category !== "inventory") {
      const { currentLevel, OpeningStock, reorderStock, inventoryAccount, ...rest } = payload;
      updates = rest;
    }
    // Otherwise just normal payload
    else {
      updates = payload;
    }

    // ✅ Only apply modified fields
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== (updated as any)[key]) {
        (updated as any)[key] = value;
      }
    }

    await updated.save({session:session});
    await session.commitTransaction()
    res.status(200).json({ data: updated, success: true, statusCode: 200 });
  } catch (error) {
    await session.abortTransaction()
    next(error);
  }finally{
    await session.endSession()
  }
};


/**
 * @description Delete an item service by ID
 * @type DELETE
 * @path /api/item-services/:id
 */
const deleteItemService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const documentId = new mongoose.Types.ObjectId(req.params.id);
    await ItemService.deleteOne({ _id: documentId }).session(session)
   
    await session.commitTransaction();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message:"Deleted Successsfully"
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally{
      await session.endSession();
    }
};


const importProductServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    /** ---- Resolve account names to ObjectIds ---- */
    const accountNames = [
      ...new Set([
        ...parsedData.map((r: any) => r.incomeAccount?.trim()).filter(Boolean),
        ...parsedData.map((r: any) => r.expenseAccount?.trim()).filter(Boolean),
        ...parsedData.map((r: any) => r.inventoryAccount?.trim()).filter(Boolean),
      ]),
    ] as string[];

    const accounts = await ChartOfAccount.find(
      { name: { $in: accountNames }, companyId },
      { _id: 1, name: 1 }
    ).session(session);

    const accountMap = new Map(accounts.map((a: any) => [a.name.toLowerCase(), a._id]));

    const missingAccounts = accountNames.filter(n => !accountMap.has(n.toLowerCase()));
    if (missingAccounts.length > 0) {
      throw new AppError(`The following accounts were not found in your chart of accounts: ${missingAccounts.join(', ')}`, 400);
    }

    /** ---- Duplicate name check ---- */
    const incomingNames = parsedData.map((r: any) => r.name?.trim().toLowerCase()).filter(Boolean);
    const existing = await ItemService.find(
      { name: { $in: incomingNames }, companyId },
      { name: 1 }
    ).session(session);
    if (existing.length > 0) {
      throw new AppError(`The following products already exist in your company: ${existing.map((p: any) => p.name).join(', ')}`, 400);
    }

    /** ---- Build final records ---- */
    const products: IProductService[] = [];
    for (const row of parsedData) {
      const doc = new ItemService({
        ...row,
        name: row.name?.trim(),
        incomeAccount: accountMap.get(row.incomeAccount?.trim().toLowerCase()),
        expenseAccount: accountMap.get(row.expenseAccount?.trim().toLowerCase()),
        inventoryAccount: row.inventoryAccount ? accountMap.get(row.inventoryAccount?.trim().toLowerCase()) : undefined,
        id: await generateUniqueId({ prefix: 'PS-', session, companyId: res.locals.companyId as unknown as Types.ObjectId }),
      });
      await doc.validate();
      await doc.save({ session });
      products.push(doc);
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, statusCode: 201, data: products });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};

export { createItemService, getAllItemServices, getItemServiceById, updateItemService, deleteItemService, importProductServices };
