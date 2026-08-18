import { Schema } from "mongoose";
import User from "../user.model";
import { Role } from "microservices/auth-service/types";
import { IUserPlanDocument } from "models/user.plans.model";

export const companyPlanLimitPlugin = (schema: Schema) => {
  schema.pre("save", async function (next: any) {
    try {
      if (!this.createdBy) return next();

      const creator = await User.findById(this.createdBy)
        .select("role ownerAdminId ActivePlan")
        .populate<{ ActivePlan: { PlanId: IUserPlanDocument; expires: Date } }>("ActivePlan.PlanId");

      if (!creator) return next(new Error("Creator not found"));

      if (!this.ownerAdminId) {
        this.ownerAdminId =
          creator.role === Role.MANAGER ? creator.ownerAdminId : creator._id;
      }

      if (creator.role === Role.SUPERADMIN) return next();

      const planOwner =
        creator.role === Role.MANAGER
          ? await User.findById(creator.ownerAdminId)
              .select("ActivePlan")
              .populate<{ ActivePlan: { PlanId: IUserPlanDocument; expires: Date } }>("ActivePlan.PlanId")
          : creator;

      if (!planOwner) return next(new Error("Plan owner not found"));

      const activePlan = planOwner.ActivePlan;
      if (!activePlan?.PlanId) return next(new Error("No active subscription plan found"));

      if (activePlan.expires && new Date(activePlan.expires) < new Date()) {
        return next(new Error("Subscription expired. Please renew your subscription."));
      }

      const adminId = creator.role === Role.MANAGER ? creator.ownerAdminId : creator._id;
      const [maxCompanies, usedCompanies] = await Promise.all([
        Promise.resolve(activePlan.PlanId.noOfCompanies || 0),
        (this.constructor as any).countDocuments({ ownerAdminId: adminId }),
      ]);

      if (this.isNew && usedCompanies >= maxCompanies) {
        return next(
          new Error(`Company limit exceeded. Your current plan allows only ${maxCompanies} companies.`)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  });
};