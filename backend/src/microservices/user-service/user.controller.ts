import { Request, Response, NextFunction } from "express";

import User, { IUserDocument } from "../../models/user.model";
import { AppError } from "middlewares/error";
import { createRegex, parseJSON } from "libs";
import pagination from "utils/pagination";
import { Role } from "microservices/auth-service/types";
import mongoose, { PipelineStage, Types } from "mongoose";
import companyModel from "models/company.model";
import { UserPermissionChecker } from "utils/roleBaseAccessControl";
import { Producer } from "config/rabbitmq/producers";
import { FRONTEND_URL } from "config";
import ejs from "ejs";
import path from "path";
import sendEmail from "libs/sendEmail";
import UserPlan from "models/user.plans.model";
/**

 * @description Get All Users

 * @type GET 

 * @path /api/users/allusers

 */

const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, isActive = "", isBlocked, search, role, sortFields, } = req.query;
    const currentRole = req.user?.role
    const matchSatge: Record<string, any> = {
      _id: { $ne: new Types.ObjectId(req.user?._id as unknown as string) }
    }
    let sortPipeline: PipelineStage.Sort = { $sort: {} }
    if (isActive) {
      matchSatge.isActive = parseJSON(isActive as string);
    }
    if (isBlocked) {
      matchSatge.isBlocked = parseJSON(isBlocked as string);
    }
    if (currentRole === Role.SUPERADMIN) {
      matchSatge.role = Role.ADMIN
    }
    if (currentRole === Role.ACCOUNTANT) {
      matchSatge.manager = new mongoose.Types.ObjectId(req.user?._id)
    }
    if (currentRole === Role.ADMIN) {
      matchSatge.ownerAdminId = new mongoose.Types.ObjectId(req.user?._id)
    }
    if (role) {
      matchSatge.role = role
    }
    if (search) {
      matchSatge.$or = [
        { name: createRegex(search as string) },
        { email: createRegex(search as string) },
      ];
    }
    if (sortFields) {
      const parsedSortFields = parseJSON(sortFields as string);

      if (Array.isArray(parsedSortFields) && parsedSortFields.length) {
        const multiSort: Record<string, 1 | -1> = {};
        parsedSortFields.forEach((field: any) => {
          if (!field.field || !field.order) return;

          if (field.field === "firstPickupDate") {
            multiSort["pickupLocationId.0.date"] = field.order === "desc" ? -1 : 1;
          } else {
            multiSort[field.field] = field.order === "desc" ? -1 : 1;
          }
        });
        sortPipeline = {
          $sort: multiSort,
        }
      }
    }
    const isSortAvaible = Boolean(Object.keys(sortPipeline.$sort).length)
    const result = await User.aggregate([
      { $match: matchSatge },
      ...(isSortAvaible ? [sortPipeline] : []),
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
      {
        $facet: {
          data: [
            ...pagination(page as string, limit as string),
          ], // Ensure pagination returns an array of valid pipeline stages

          total: [{ $count: "total" }],
        },
      },
      {
        $project: {
          data: 1,

          total: { $arrayElemAt: ["$total.total", 0] }, // Extract total count correctly
        },
      },
    ]);



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

}





/**

 * @description Create a New User

 * @type POST 

 * @path /api/users/

 */

const createUser =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      req.body.createdBy = req.user?._id

      const targetRole = req.body.role as Role;

      req.body.updatedBy = req.user?._id

      // Permission checks

      const checker = new UserPermissionChecker(req.user as IUserDocument);

      await checker.canUserUpdate(targetRole);

      if (req.user?.role == Role.ADMIN) {

        req.body.ownerAdminId = req.user._id

      }

      else if (req.user?.role == Role.ACCOUNTANT ) {

        req.body.ownerAdminId = req.user.ownerAdminId,

          req.body.manager = req.user._id

      }

      let user = await User.create(req.body)

      await Producer.createUser({ id: user._id.toString(), password: req.body.password });



      res.status(201).json({

        data: user,

        success: true,

        message: "User created successfully",

        statusCode: 201,

      });

    } catch (error) {

      next(error);

    }

  }



/**

 * @description Get a Single User by ID

 * @type GET 

 * @path /api/users/:id

 */

const getUserById =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      const { id } = req.params;

      const user = await User.findById(id);

      const company = await companyModel.findById(res.locals.companyId);

      if (!user) {

        throw new AppError("User not found", 404);

      }

      res.status(200).json({ data: user, success: true, statusCode: 200, company });

    } catch (error) {

      next(error);

    }

  }



/**

 * @description Update User by ID

 * @type PUT 

 * @path /api/users/:id

 */

const updateUser =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      const { id } = req.params;

      const targetRole = req.body.role as Role;

      req.body.updatedBy = req.user?._id

      // Permission checks

      const checker = new UserPermissionChecker(req.user as IUserDocument);

      await checker.canUserUpdate(targetRole);



      const user = await User.findById(id);

      if (!user) {

        throw new AppError("User not found", 404);

      }



      // Update fields except password

      Object.entries(req.body).forEach(([key, value]) => {

        if (key !== 'password' && key in user) {

          (user as any)[key] = value;

        }

      });



      // Handle password separately if provided

      if (req.body.password) {

        user.password = req.body.password;

      }

      if (req.user?.role == Role.ADMIN) {

        user.ownerAdminId = req.user._id

      }

      await user.save();



      res.status(200).json({

        data: user,

        success: true,

        message: "User updated successfully",

        statusCode: 200,

      });

    } catch (error) {

      next(error);

    }

  }





/**

 * @description Delete User by ID

 * @type DELETE 

 * @path /api/users/:id

 */

const deleteUser =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      const { id } = req.params;

      const transaction = await mongoose.startSession();

      transaction.startTransaction();

      try {



        const user = await User.findById(id).session(transaction);



        if (!user) {

          throw new AppError("User not found", 404);

        }

        const targetRole = user.role as Role;

        const checker = new UserPermissionChecker(req.user as IUserDocument);

        await checker.canUserUpdate(targetRole);



        const db = mongoose.connection.db;

        if (!db) {

          throw new AppError("Database connection not available", 500);

        }



        const userId = new Types.ObjectId(id);



        if (targetRole === Role.ADMIN) {

          const adminCompanyIds = await db

            .collection("companies")

            .distinct("_id", { ownerAdminId: userId }, { session: transaction });



          if (adminCompanyIds.length) {

            const companyScopedCollections = [

              "loads",

              "accountsinvoices",

              "vendorbills",

              "estimates",

              "expenses",

              "expensefees",

              "accountspayments",

              "paymentterms",

              "taxservices",

              "productservices",

              "notifications",

              "journalentries",

              "chartofaccounts",

              "ledgertransactions",

              "reports",

              "contactcarriers",

              "contactpeople",

              "carriers",

              "drivers",

              "customers",

              "notes",

              "accountstatements",

              "invoicereminders",

              "trucktrackings",

              "vinrecords",

              "counters",

              "creditnotes",

              "debitnotes",

              "paymentallocations",

            ];



            await Promise.all(

              companyScopedCollections.map((collectionName) =>

                db.collection(collectionName).deleteMany(

                  { companyId: { $in: adminCompanyIds } },

                  { session: transaction }

                )

              )

            );



            await db.collection("companies").deleteMany(

              { _id: { $in: adminCompanyIds } },

              { session: transaction }

            );

          }



          await db.collection("users").deleteMany(

            {

              $or: [

                { _id: userId },

                { ownerAdminId: userId },

                { createdBy: userId },

              ],

            },

            { session: transaction }

          );

        } else {

          await db.collection("users").deleteOne({ _id: userId }, { session: transaction });

        }

        await transaction.commitTransaction();

        transaction.endSession();

        res

          .status(200)

          .json({

            success: true,

            message: "User deleted successfully",

            statusCode: 200,

          });

      } catch (error) {

        await transaction.abortTransaction();

        transaction.endSession();

        next(error);

      }

    } catch (error) {

      next(error);

    }

  }

const userActivate =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      const { id } = req.params;

      const { isActive } = req.body;



      const user = await User.findById(id);

      if (!user) {

        throw new AppError("User not found", 404);

      }

      const targetRole = user.role as Role;

      // Permission checks

      const checker = new UserPermissionChecker(req.user as IUserDocument);

      await checker.canUserUpdate(targetRole);

      user.isActive = isActive;

      user.updatedBy = req.user?._id as unknown as Types.ObjectId;

      if (req.user?.role == Role.ADMIN) {

        user.ownerAdminId = req.user._id

      }

      await user.save();



      const message = isActive

        ? "User activated successfully"

        : "User deactivated successfully";

      res.status(200).json({

        data: user,

        success: true,

        message: message,

        statusCode: 200,

      });

    } catch (error) {

      next(error);

    }

  }

const userBlock =

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {

      const { id } = req.params;

      const { isBlocked } = req.body;

      const user = await User.findById(id);

      if (!user) {

        throw new AppError("User not found", 404);

      }

      const targetRole = user.role as Role;

      // Permission checks

      const checker = new UserPermissionChecker(req.user as IUserDocument);

      await checker.canUserUpdate(targetRole);



      user.isBlocked = isBlocked;

      user.updatedBy = req.user?._id as unknown as Types.ObjectId;

      if (req.user?.role == Role.ADMIN) {

        user.ownerAdminId = req.user._id

      }

      await user.save();

      const message = isBlocked

        ? "User Blocked successfully"

        : "User Unblock successfully";

      res.status(200).json({

        data: user,

        success: true,

        message: message,

        statusCode: 200,

      });

    } catch (error) {

      next(error);

    }

  }



/**

 * @description Reset Password

 * @type Rabitmq 

 * @param data

 * @returns void

 */

const handleResetPasswordRabitMQ = async (data: any) => {

  try {

    const { id } = data;

    const user = await User.findById(id)

    if (!user) {

      return

    }

    // Create reset URL

    const resetUrl = `${FRONTEND_URL}/reset-password/${user.resetPasswordToken}`;

    const html = await ejs.renderFile(path.join(__dirname, "../auth-service/passwordreset.ejs"), { resetUrl });

    await sendEmail({ to: user.email, subject: "Password Reset Request", html });

  } catch (error) {

    console.error('Error in bill generation:', error);

    throw error;

  }

};

/**

 * @description Create User

 * @type Rabitmq 

 * @param data

 * @returns void

 */

const handleCreateUserRabitMQ = async (data: any) => {

  try {

    const { id, password } = data;

    let user = await User.findById(id).populate("manager")

    if (!user) {

      return

    }

    user = user.toObject();

    const html = await ejs.renderFile(path.join(__dirname, "../../microservices/user-service/usercreated.ejs"), { ...user, password: password, manager: user.manager });

    await sendEmail({ to: user.email, subject: "User Created", html });

  } catch (error) {

    console.error('Error in bill generation:', error);

    throw error;

  }

};



/**

 * @description Renew Plan for Admin User

 * @type POST 

 * @path /api/users/renew-plan/:id

 * @access SUPERADMIN only

 */

const renewPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  try {

    const { id } = req.params;

    const { planId } = req.body;



    // Only superadmin can renew plans

    if (req.user?.role !== Role.SUPERADMIN) {

      throw new AppError("Only superadmin can renew plans", 403);

    }



    const user = await User.findById(id).populate('ActivePlan.PlanId');

    if (!user) {

      throw new AppError("User not found", 404);

    }



    if (user.role !== Role.ADMIN) {

      throw new AppError("Plan renewal is only available for admin users", 400);

    }



    // Get the plan details

    const plan = await UserPlan.findById(planId);

    if (!plan) {

      throw new AppError("Plan not found", 404);

    }



    // Calculate new expiration date

    const currentExpiry = user.ActivePlan?.expires ? new Date(user.ActivePlan.expires) : new Date();

    const now = new Date();

    const baseDate = currentExpiry > now ? currentExpiry : now;

    const newExpiry = new Date(baseDate);

    newExpiry.setDate(newExpiry.getDate() + plan.noOfDays);



    // Update user's active plan

    user.ActivePlan = {

      PlanId: plan._id as Types.ObjectId,

      expires: newExpiry

    };



    await user.save();



    res.status(200).json({

      data: user,

      success: true,

      message: "Plan renewed successfully",

      statusCode: 200,

    });

  } catch (error) {

    next(error);

  }

};


export { getAllUsers, getUserById, updateUser, deleteUser, createUser, userActivate, userBlock, handleResetPasswordRabitMQ, handleCreateUserRabitMQ, renewPlan };

