import { Request, Response, NextFunction } from "express";
import { Role } from "microservices/auth-service/types";

export const checkPlanExpiry = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {

    const user= req.user
    if (!user) {
      return next(new Error("User not found"));
    }

    /**
     * Super admin bypass
     */
    if (
      user.role ===Role.SUPERADMIN
    ) {
      return next();
    }

    /**
     * Only check admin subscription
     */
    if (user.role === Role.ADMIN) {

      if (
        !user.ActivePlan ||
        !user.ActivePlan.expires
      ) {
        return next(
          new Error(
            "No active subscription found. Please subscribe."
          )
        );
      }

      const isExpired =
        new Date(user.ActivePlan.expires) < new Date();

      if (isExpired) {
        return next(
          new Error(
            "Your subscription has expired. Please renew your plan."
          )
        );
      }
    }

    next();

  } catch (error) {
    next(error);
  }
};