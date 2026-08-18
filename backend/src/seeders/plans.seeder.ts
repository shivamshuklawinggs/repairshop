import { ClientSession, Types } from "mongoose";

import UserPlan from "models/user.plans.model";
import { defaultPlans } from "./data";

interface SeedPlansProps {
  superAdminId: Types.ObjectId;
  session: ClientSession;
}

/**
 * Creates or updates default plans
 */
const seedPlans = async ({
  superAdminId,
  session,
}: SeedPlansProps): Promise<void> => {
  const plans = defaultPlans({ superAdminId });

  if (!plans.length) {
    console.warn("⚠️ No default plans found");
    return;
  }

  const bulkOps = plans.map((plan) => ({
    updateOne: {
      filter: { name: plan.name },
      update: {
        $setOnInsert: {
          ...plan,
        },
      },
      upsert: true,
    },
  }));

  const result = await UserPlan.bulkWrite(bulkOps, {
    ordered: false,
    session,
  });

  console.info(
    `✅ Plans seeding completed | Inserted: ${
      result.upsertedCount || 0
    } | Modified: ${result.modifiedCount || 0}`
  );
};

export default seedPlans;