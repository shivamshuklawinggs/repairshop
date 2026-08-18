import { Request, Response, NextFunction } from "express";
import { AppError } from "middlewares/error";
import UserPlan from "models/user.plans.model";
import { parseJSON, createRegex } from "libs";
import { Types } from "mongoose";
import User from "models/user.model";

/**
 * GET /api/plans
 */
export const listPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try{
  const { page = 1, limit = 10, search = "", isActive = "" } = req.query;
  const match: Record<string, any> = {};
  if (search) {
    match.$or = [
      { name: createRegex(search as string) },
      { description: createRegex(search as string) },
    ];
  }
  if (isActive !== "") {
    match.isActive = parseJSON(isActive as string);
  }

  const result = await UserPlan.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
        ],
        total: [{ $count: "total" }],
      },
    },
    {
      $project: {
        data: 1,
        total: { $ifNull: [{ $arrayElemAt: ["$total.total", 0] }, 0] },
      },
    },
  ]);

  const data = result[0]?.data || [];
  const total = result[0]?.total || 0;

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    statusCode: 200,
  });
} catch (error) {
  next(error)
}
}

/**
 * POST /api/plans
 */
export const createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const createdBy = req.user?._id;
    const plan = await UserPlan.create({ ...req.body, createdBy });
    res.status(201).json({ success: true, data: plan, message: "Plan created", statusCode: 201 });
  } catch (error) {
     next(error)
  }
}

/**
 * GET /api/plans/:id
 */
export const getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plan = await UserPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404);
    res.status(200).json({ success: true, data: plan, statusCode: 200 });
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/plans/:id
 */
export const updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plan = await UserPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404);
    Object.assign(plan, req.body, { updatedBy: req.user?._id });
    await plan.save();
    res.status(200).json({ success: true, data: plan, message: "Plan updated", statusCode: 200 });
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/plans/:id
 */
export const deletePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // check plan exist on current users
    const user = await User.findOne({ planId: req.params.id });
    if (user) throw new AppError("Plan is in use", 400);
    const plan = await UserPlan.findByIdAndDelete(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404);
    res.status(200).json({ success: true, message: "Plan deleted", statusCode: 200 });
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/plans/:id/activate
 */
export const setPlanActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const plan = await UserPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404);
    plan.isActive = Boolean(isActive);
    plan.updatedBy = req.user?._id as unknown as  Types.ObjectId
  await plan.save();
  res.status(200).json({ success: true, data: plan, message: "Plan status updated", statusCode: 200 });
} catch (error) {
  next(error)
}
}
