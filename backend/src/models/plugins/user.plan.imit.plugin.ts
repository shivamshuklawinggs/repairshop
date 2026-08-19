import { Schema } from "mongoose";
import User from "../user.model";
import { Role } from "microservices/auth-service/types";
import UserPlan, { IUserPlanDocument } from "models/user.plans.model";
import { canCreatorAssignRole } from "utils/roleBaseAccessControl";
export const planLimitPlugin = (schema: Schema) => {
  schema.pre("save", async function (next: any) {
    try {
      if (this.role == Role.ACCOUNTANT) {
        this.manager = this._id
      }
      // ── 2. New ADMIN setup ───────────────────────────────────────────────────
      if (this.role === Role.ADMIN) {
      
        if (!this.ownerAdminId) this.ownerAdminId = this._id;

        if (!this.ActivePlan.PlanId) {
          const freePlan = await UserPlan.findOne({ price: 0 }).select("_id noOfDays");
       
          if (freePlan) {
            const expires = new Date();
            expires.setDate(expires.getDate() + (freePlan.noOfDays || 15));
            this.ActivePlan = { PlanId: freePlan._id, expires };
          } else {
            console.log('⚠️ [planLimitPlugin] No free plan found in database!');
          }
        }
      }
      // ── 3. Plan limit + role assignment checks (new docs with a creator only) ─
      if (!this.createdBy) return next();
      const creator = await User.findById(this.createdBy)
        .select("role ownerAdminId ActivePlan")
        .populate<{ ActivePlan: { PlanId: IUserPlanDocument; expires: Date } }>("ActivePlan.PlanId");

      if (!creator) return next(new Error("Creator not found"));

      // Validate creator is allowed to assign this role
      if (!canCreatorAssignRole(creator.role, this.role)) {
        return next(
          new Error(`A ${creator.role} is not allowed to create users with the ${this.role} role`)
        );
      }

      // Derive ownerAdminId from creator (ADMIN case handled above)
      if (!this.ownerAdminId && this.role !== Role.ADMIN) {
        this.ownerAdminId =
          creator.role === Role.ACCOUNTANT ? creator.ownerAdminId : creator._id;
      }

      // SUPERADMIN bypasses plan limits
      if (creator.role === Role.SUPERADMIN) return next();

      // For MANAGER, validate against their ownerAdmin's plan
      const planOwner =
        creator.role === Role.ACCOUNTANT
          ? await User.findById(creator.ownerAdminId)
            .select("ActivePlan")
            .populate<{ ActivePlan: { PlanId: IUserPlanDocument; expires: Date } }>("ActivePlan.PlanId")
          : creator;

      if (!planOwner) return next(new Error("Plan owner not found"));

      const activePlan = planOwner.ActivePlan;
      if (!activePlan?.PlanId) return next(new Error("No active subscription plan found"));
      if(activePlan.PlanId.isUnlimited) return next()
      if (activePlan.expires && new Date(activePlan.expires) < new Date()) {
        return next(new Error("Subscription expired. Please renew your subscription."));
      }

      const adminId = creator.role === Role.ACCOUNTANT ? creator.ownerAdminId : creator._id;

      const [maxUsers, usedUsers] = await Promise.all([
        Promise.resolve(activePlan.PlanId.noOfUsers || 0),
        User.countDocuments({ ownerAdminId: adminId }),
      ]);

      if (this.isNew && usedUsers >= maxUsers) {
        return next(
          new Error(`User limit exceeded. Your current plan allows only ${maxUsers} users.`)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  });
};
