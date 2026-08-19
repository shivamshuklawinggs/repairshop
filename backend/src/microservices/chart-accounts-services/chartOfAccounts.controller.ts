import { Request, Response, NextFunction } from 'express';
import ChartOfAccount from 'models/chartOfAccounts.model';
import { AppError } from 'middlewares/error';
import mongoose, { PipelineStage, Types } from 'mongoose';

import AccountType, { balanceSheets, IAccountTypeEnum, masterType, profitAndLoss } from 'models/AccountType.model';
import AccountDetailType from 'models/accountDetailType.model';
import { createRegex } from 'libs';
// import { AccountRegisterEndingBalancePipeline } from './services/masterChart.service';
import { generateUniqueId, PrefixType } from 'models/universalid.model'
import { ledgerAdapter } from 'models/Ledger.model';
import DateTimeFilter from 'utils/postedadate';
import { buildAccountMatchRecord } from './utils/buildAccountMatchRecord';
import { netProfitAndLoss } from 'microservices/report-services/services/netProfitAndLoss';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import { defaultChartsDetailTypeidIdsEnum } from './services/Accounttypes.service';
import { ExcelField, parseJsonToExcel } from 'utils/parseJsonToExcel';


/**
 * @description Create a new chart of account
 * @type POST
 * @path /api/chart-accounts
 */
const createChartAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      req.body.createdBy = req.user?._id;
      req.body.manager = req.user?.manager
      req.body.ownerAdminId = req.user?.ownerAdminId
      req.body.updatedBy = req.user?._id;
      req.body.companyId = res.locals.companyId;

      const accountType = await AccountType.findById(req.body.accountType).lean();
      if (!accountType) {
        throw new AppError('Invalid account type', 400);
      }

      req.body.accountTypeData = accountType
      const detailType = await AccountDetailType.findById(req.body.detailType).lean();
      if (!detailType) {
        throw new AppError('Invalid account type', 400);
      }
      req.body.masterType = detailType.masterType
      req.body.detailTypeData = detailType
      req.body.typeId = detailType.typeId
      req.body.type = detailType.type
      const prefix = balanceSheets.includes(accountType.type) ? "BAL-" : profitAndLoss.includes(accountType?.type) ? "PL-" : "UNKNOWN-"
      req.body.id = await generateUniqueId({ prefix: prefix as PrefixType, session, companyId: res.locals.companyId as unknown as Types.ObjectId })

      const [account] = await ChartOfAccount.create([req.body], { session });

      // Store result for response outside transaction
      (req as any).createdAccount = account;

    });

    res.status(201).json({ data: (req as any).createdAccount, success: true, statusCode: 201 });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/**
 * @description Get all chart of accounts
 * @type GET
 * @path /api/chart-accounts
 */
const getAllChartAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      type,
      search,
      page = "1",
      limit = "10",
      multiname,
      removeMasters,
      regularExpression,
      isChartData = "0",
      nor = "",
      isProductServicesPage = ""
    } = req.query as {
      type?: IAccountTypeEnum | string;
      search?: string;
      page?: string;
      limit?: string;
      multiname?: string;
      removeMasters?: string;
      regularExpression?: "TAX" | "DISCOUNT";
      isChartData?: "1" | "0";
      nor?: string;
      isProductServicesPage: string
    };

    const isChartEnabled = isChartData === "1";

    const companyId = new Types.ObjectId(
      res.locals.companyId
    );

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.max(
      Number(limit) || 10,
      1
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // =====================================================
    // QUERY
    // =====================================================

    const initialquery: Record<string, any> = {
      companyId,
    };

    // TYPE
    if (type) {
      if (type === "createdBy") {
        initialquery.createdBy =
          new Types.ObjectId(
            req.user?._id as string
          );
      } else {
        initialquery["accountTypeData.type"] = {
          $in: type.split(","),
        };
      }
    }

    // SEARCH
    if (search?.trim()) {
      initialquery.name = createRegex(
        search.trim()
      );
    }

    // MULTI NAME
    if (multiname?.trim()) {
      initialquery["accountTypeData.name"] = {
        $in: multiname.split(","),
      };
    }

    // REMOVE MASTERS
    const excludedMasters: string[] = [];

    if (removeMasters?.trim()) {
      excludedMasters.push(
        ...removeMasters.split(",")
      );
    }

    // hide retained earnings
    if (!isChartEnabled) {
      excludedMasters.push(
        masterType.retainedearnings
      );
    }

    if (excludedMasters.length) {
      initialquery.masterType = {
        $nin: [...new Set(excludedMasters)],
      };
    }
    if (isProductServicesPage == "1") {
      initialquery["SystemAccount"] = false
    }

    // REGEX FILTERS
    if (regularExpression === "DISCOUNT") {
      initialquery["SystemAccount"] = true
      initialquery[
        "detailTypeData.detailType"
      ] = {
        $in: [
          defaultChartsDetailTypeidIdsEnum.DISCOUNTS_GIVEN,
          defaultChartsDetailTypeidIdsEnum.DISCOUNTS_RECEIVED,
        ],
      };
    }

    if (regularExpression === "TAX") {
      initialquery["SystemAccount"] = true
      initialquery[
        "detailTypeData.detailType"
      ] = {
        $in: [
          defaultChartsDetailTypeidIdsEnum.PURCHASE_TAX,
          defaultChartsDetailTypeidIdsEnum.SALES_TAX_PAYABLE,
        ],
      };
    }

    // NOR
    if (nor?.trim()) {
      initialquery.$nor = nor
        .split(",")
        .map((item) => ({
          "detailTypeData.detailTypeEnumName":
            createRegex(item),
        }));
    }

    // =====================================================
    // NET PROFIT
    // ONLY WHEN REQUIRED
    // =====================================================

    let netProfit = 0;

    if (isChartEnabled) {
      const [profitData = { netProfit: 0 }] =
        await ChartOfAccount.aggregate(
          netProfitAndLoss({
            matchStage: {
              companyId,
            },
            res,
          })
        ).limit(1);

      netProfit = profitData.netProfit || 0;
    }

    // =====================================================
    // BASE PIPELINE
    // PAGINATION BEFORE LOOKUP
    // =====================================================

    const pipeline: PipelineStage[] = [
      {
        $match: initialquery,
      },

      {
        $sort: {
          name: 1,
        },
      },

      // =============================================
      // PAGINATION FIRST
      // =============================================

      ...(page
        ? [
          {
            $skip: skip,
          },

          {
            $limit: limitNumber,
          },
        ]
        : []),

      // =============================================
      // HEAVY LOOKUPS AFTER PAGINATION
      // =============================================

      ...(isChartEnabled
        ? ([
          {
            $lookup: {
              from: "ledgertransactions",

              localField: "_id",

              foreignField: "accountId",

              pipeline: [
                {
                  $group: {
                    _id: null,

                    totalCredits: {
                      $sum: {
                        $ifNull: [
                          "$credit",
                          0,
                        ],
                      },
                    },

                    totalDebits: {
                      $sum: {
                        $ifNull: [
                          "$debit",
                          0,
                        ],
                      },
                    },
                  },
                },
              ],

              as: "ledger",
            },
          },

          {
            $unwind: {
              path: "$ledger",
              preserveNullAndEmptyArrays: true,
            },
          },

          // =========================================
          // NORMALIZE VALUES
          // =========================================

          {
            $set: {
              totalCredits: {
                $ifNull: [
                  "$ledger.totalCredits",
                  0,
                ],
              },

              totalDebits: {
                $ifNull: [
                  "$ledger.totalDebits",
                  0,
                ],
              },
            },
          },

          // =========================================
          // RETAINED EARNINGS
          // =========================================

          {
            $set: {
              totalCredits: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$masterType",
                          masterType.retainedearnings,
                        ],
                      },

                      {
                        $gt: [netProfit, 0],
                      },
                    ],
                  },

                  {
                    $add: [
                      "$totalCredits",
                      netProfit,
                    ],
                  },

                  "$totalCredits",
                ],
              },

              totalDebits: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$masterType",
                          masterType.retainedearnings,
                        ],
                      },

                      {
                        $lt: [netProfit, 0],
                      },
                    ],
                  },

                  {
                    $add: [
                      "$totalDebits",
                      {
                        $abs: netProfit,
                      },
                    ],
                  },

                  "$totalDebits",
                ],
              },
            },
          },

          // =========================================
          // BALANCE
          // =========================================

          {
            $set: {
              endingBalanceNumeric: {
                $round: [
                  {
                    $subtract: [
                      "$totalDebits",
                      "$totalCredits",
                    ],
                  },
                  2,
                ],
              },
            },
          },

          {
            $set: {
              endingBalance: {
                $concat: [
                  {
                    $toString: {
                      $abs:
                        "$endingBalanceNumeric",
                    },
                  },

                  " ",

                  {
                    $cond: [
                      {
                        $lt: [
                          "$endingBalanceNumeric",
                          0,
                        ],
                      },

                      "Cr",

                      "Dr",
                    ],
                  },
                ],
              },
            },
          },

          {
            $unset: "ledger",
          },
        ] as PipelineStage[])
        : []),
    ];

    // =====================================================
    // EXECUTE IN PARALLEL
    // =====================================================

    const [accounts, total] =
      await Promise.all([
        ChartOfAccount.aggregate(pipeline),

        page
          ? ChartOfAccount.countDocuments(
            initialquery
          )
          : Promise.resolve(0),
      ]);

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({
      data: page
        ? {
          data: accounts,
          total,
        }
        : accounts,

      success: true,

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update a chart of account
 * @type PUT
 * @path /api/chart-accounts/:id
 */
const updateChartAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      req.body.updatedBy = req.user?._id;

      const [account] = await ChartOfAccount.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.id),
            companyId: new Types.ObjectId(res.locals.companyId)
          }
        },
      ]);
      if (req.body.accountType) {
        const accountType = await AccountType.findById(req.body.accountType).lean();
        if (!accountType) {
          throw new AppError('Invalid account type', 400);
        }
        // Don't set accountTypeData - it's immutable
      }
      if (req.body.detailType) {
        const detailType = await AccountDetailType.findById(req.body.detailType).lean();
        if (!detailType) {
          throw new AppError('Invalid account type', 400);
        }
        req.body.masterType = detailType.masterType
        req.body.typeId = detailType.typeId
        req.body.type = detailType.type
        // Don't set detailTypeData - it's immutable
      }
      if (!account) {
        throw new AppError('Account not found', 404);
      }
      const updated = await ChartOfAccount.findOneAndUpdate(
        { _id: req.params.id, companyId: res.locals.companyId },
        req.body,
        { new: true, session }
      );

      if (!updated) {
        throw new AppError('Account not found', 404);
      }
      res.status(200).json({ data: updated, success: true, statusCode: 200 });
    });


  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/**
 * @description Delete (soft) a chart of account
 * @type DELETE
 * @path /api/chart-accounts/:id
 */
const deleteChartAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const documentId = new mongoose.Types.ObjectId(req.params.id);
      const [{ endingBalanceNumeric = 0 }] = await ChartOfAccount.aggregate([{
        $match: {
          _id: documentId,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
        }
      },  // Bring in payments / invoices / bills / journals
      ...(ledgerAdapter.ledgerFromChart()),
      ])
        .limit(1)
      if (endingBalanceNumeric < 0 || endingBalanceNumeric > 0) {
        throw new AppError('Account has transactions and cannot be deleted', 400);
      }
      else if (endingBalanceNumeric == 0) {
        await ChartOfAccount.deleteOne({ _id: documentId }).session(session)
      }
    });

    res.status(200).json({ success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

const getChartAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await ChartOfAccount.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(req.params.id),
          companyId: new Types.ObjectId(res.locals.companyId)
        }
      },
    ]);


    if (!account) {
      throw new AppError("Account not found", 404);
    }

    res.status(200).json({ data: account, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
const getEndingBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const chartofAccount = await ChartOfAccount.findById(
      req.params.id
    ).lean();

    if (!chartofAccount) {
      throw new AppError("Acccount Not Find", 400);
    }

    const { matchRecord } = await buildAccountMatchRecord({
      companyId: res.locals.companyId,
      accountId: req.params.id,
      chartofAccount,
    });

    const { initalMatchStage } = DateTimeFilter.FilterByDate({
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      field: "postingDate",
      initialMatchStage: {},
    });
    const [account] = await ChartOfAccount.aggregate([
      {
        $match: matchRecord,
      },

      {
        $lookup: {
          from: "ledgertransactions",
          localField: "_id",
          foreignField: "accountId",
          pipeline: [
            {
              $match: initalMatchStage,
            },
            {
              $group: {
                _id: null,
                totalCredits: {
                  $sum: {
                    $ifNull: ["$credit", 0],
                  },
                },
                totalDebits: {
                  $sum: {
                    $ifNull: ["$debit", 0],
                  },
                },
              },
            },
            {
              $addFields: {
                endingBalanceNumeric: {
                  $round: [
                    {
                      $subtract: [
                        "$totalDebits",
                        "$totalCredits",
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          ],
          as: "ledger",
        },
      },

      {
        $unwind: {
          path: "$ledger",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          endingBalanceNumeric: {
            $ifNull: [
              "$ledger.endingBalanceNumeric",
              0,
            ],
          },
        },
      },

      {
        $group: {
          _id: null,

          endingBalanceNumeric: {
            $sum: "$endingBalanceNumeric",
          },
        },
      },

      // generate final formatted balance AFTER total sum
      {
        $addFields: {
          symbol: {
            $cond: [
              { $lt: ["$endingBalanceNumeric", 0] },
              "Cr",
              "Dr",
            ],
          },

          endingBalance: {
            $concat: [
              {
                $toString: {
                  $abs: {
                    $round: [
                      "$endingBalanceNumeric",
                      2,
                    ],
                  },
                },
              },
              " ",
              {
                $cond: [
                  { $lt: ["$endingBalanceNumeric", 0] },
                  "Cr",
                  "Dr",
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          _id: 0,
          endingBalanceNumeric: 1,
          endingBalance: 1,
          symbol: 1,
        },
      },
    ]);

    if (!account) {
      throw new AppError("Account not found", 404);
    }

    res.status(200).json({
      data: account,
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};


const getAllTransactionsViAChartAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { id } = req.params
    const { page = 1, limit = 10, export: exportType } = req.query as {
      page: string,
      limit: string,
      export?: 'csv' | 'json'
    }
    const chartofAccount = await ChartOfAccount.findById(id).lean()
    if (!chartofAccount) {
      throw new AppError("Acccount Not Find", 400)
    }
    const { retainedEarningAccountIds, } = await buildAccountMatchRecord({ companyId: res.locals.companyId, accountId: req.params.id, chartofAccount, });
    const { initalMatchStage } = DateTimeFilter.FilterByDate({
      fromDate: req.query.fromDate as string, toDate: req.query.toDate as string, field: 'postingDate', initialMatchStage: {
        accountId: {
          $in: retainedEarningAccountIds
        }
      }
    })

    // For export, get all data without pagination
    const paginationData = exportType ? { page: 1, limit: 10000 } : { page: Number(page || 1), limit: Number(limit || 10) };
    const { data, total } = await ledgerAdapter.AccountRegister({ ...paginationData, matchStage: initalMatchStage })

    // Handle export
    if (exportType === 'csv') {
     
      const csvFields:ExcelField[] = [
        { value: 'postingDate', label: 'Date', alignment: 'center', },
        { value: 'refrenceNo', label: 'Ref No', alignment: 'center', },
        { value: 'customer', label: 'Customer/Vendor', alignment: 'center', },
        { value: 'description', label: 'Memo', alignment: 'center', },
        { value: 'debit', label: 'Debit', alignment: 'center', },
        { value: 'credit', label: 'Credit', alignment: 'center' },
        { value: 'balanceDue', label: 'Balance', alignment: 'center', },
      ];
     const base64 =await parseJsonToExcel(data, csvFields)
     return res.status(200).json({
        success: true, statusCode: 204,
        data: {
          filename: `Account-${chartofAccount.name}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          base64: base64
        }
      });
    }
   return res.status(200).json({ data: data, total: total, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

const getAccountTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = req.query.type
    const matchStage: Record<string, any> = {}
    if (type) {
      matchStage["type"] = type
    }
    const types = await AccountType.find(matchStage)

    res.status(200).json({ data: types, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};


const getSubAccountTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { AccountTypeId } = req.params;
    const subTypes = await AccountDetailType.find({ AccountTypeId, });
    res.status(200).json({ data: subTypes, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};



const importChartAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    /** ---- Resolve AccountType names -> documents ---- */
    const accountTypeNames = [...new Set(parsedData.map((r: any) => r.accountType?.trim()).filter(Boolean))] as string[];
    const accountTypeDocs = await AccountType.find(
      { name: { $in: accountTypeNames } },
      { _id: 1, name: 1, type: 1, masterType: 1, typeId: 1, detailTypeId: 1, detailType: 1 }
    ).lean();
    const accountTypeMap = new Map(accountTypeDocs.map((a: any) => [a.name.toLowerCase(), a]));
    const missingAccountTypes = accountTypeNames.filter(n => !accountTypeMap.has(n.toLowerCase()));
    if (missingAccountTypes.length > 0) {
      throw new AppError(`The following account types were not found: ${missingAccountTypes.join(', ')}`, 400);
    }

    /** ---- Resolve AccountDetailType names -> documents ---- */
    const detailTypeNames = [...new Set(parsedData.map((r: any) => r.detailType?.trim()).filter(Boolean))] as string[];
    const detailTypeDocs = await AccountDetailType.find(
      { name: { $in: detailTypeNames } },
      { _id: 1, name: 1, type: 1, masterType: 1, typeId: 1, detailTypeId: 1, detailType: 1, AccountTypeId: 1 }
    ).lean();
    const detailTypeMap = new Map(detailTypeDocs.map((d: any) => [d.name.toLowerCase(), d]));
    const missingDetailTypes = detailTypeNames.filter(n => !detailTypeMap.has(n.toLowerCase()));
    if (missingDetailTypes.length > 0) {
      throw new AppError(`The following detail types were not found: ${missingDetailTypes.join(', ')}`, 400);
    }

    /** ---- Duplicate name check ---- */
    const incomingNames = parsedData.map((r: any) => r.name?.trim()).filter(Boolean);
    const existing = await ChartOfAccount.find(
      { name: { $in: incomingNames }, companyId },
      { name: 1 }
    ).session(session);
    if (existing.length > 0) {
      throw new AppError(`The following accounts already exist: ${existing.map((a: any) => a.name).join(', ')}`, 400);
    }

    /** ---- Save records ---- */
    const records = [];
    for (const row of parsedData) {
      const accountType = accountTypeMap.get(row.accountType?.trim().toLowerCase());
      const detailType = detailTypeMap.get(row.detailType?.trim().toLowerCase());
      const prefix = balanceSheets.includes(accountType.type) ? 'BAL-' : profitAndLoss.includes(accountType.type) ? 'PL-' : 'UNKNOWN-';
      const doc = new ChartOfAccount({
        name: row.name?.trim(),
        description: row.description,
        isSubAccount: row.isSubAccount === 'true' || row.isSubAccount === true,
        accountType: accountType._id,
        accountTypeData: accountType,
        detailType: detailType._id,
        detailTypeData: detailType,
        masterType: detailType.masterType,
        typeId: detailType.typeId,
        type: detailType.type,
        companyId,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
        ownerAdminId: req.user?.ownerAdminId,
        manager: req.user?.manager,
        id: await generateUniqueId({ prefix: prefix as PrefixType, session, companyId: res.locals.companyId as unknown as Types.ObjectId }),
      });
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
  createChartAccount,
  getAllChartAccounts,
  updateChartAccount,
  deleteChartAccount,
  getChartAccountById,
  getAllTransactionsViAChartAccounts,
  getAccountTypes,
  getSubAccountTypes,
  getEndingBalance,
  importChartAccounts,
}; 
