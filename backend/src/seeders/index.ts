import mongoose, { ClientSession, Types } from "mongoose";
import seedAccountTypes from "./AccountTypes.seeder";
import { createDefaultSuperAdmin, createDefaultAdmin } from "./deafaultUsers.seeder";
import seedPlans from "./plans.seeder";
import { seedChartOfAccounts } from "./seedChartOfAccounts";

export interface SeederResult {
  success: boolean;
  errors: string[];
  skip: boolean;
  results: {
    accountTypes?: boolean;
    users?: {
      admin: Types.ObjectId;
      superAdmin: Types.ObjectId;
      companyId: Types.ObjectId;
    };
    plans?: boolean;
    chartAccounts?: boolean;
    expenseAggregationRules?: boolean;
  };
}

const MAX_RETRIES = 3;

const runWithSession = async <T>(
  name: string,
  fn: (session: ClientSession) => Promise<T>
): Promise<T> => {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } catch (error: any) {
      const isTransient =
        error?.errorLabels?.has?.("TransientTransactionError") ||
        error?.code === 112;

      if (isTransient && attempt < MAX_RETRIES - 1) {
        attempt++;
        console.warn(`⚠️ Transient transaction error in ${name}, retrying (attempt ${attempt}/${MAX_RETRIES})...`);
        await new Promise((res) => setTimeout(res, 500 * attempt));
      } else {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }
  throw new Error(`${name} failed after max retries`);
};

const Seeder = async (skip = false): Promise<SeederResult> => {
  const errors: string[] = [];
  const results: SeederResult["results"] = {};

  try {
    console.log("🌱 Starting default data initialization...");
    if (skip) {
      return { success: true, errors, results, skip: true };
    }

    console.log("📊 Seeding account types...");
    await runWithSession("seedAccountTypes", (session) => seedAccountTypes({ session }));
    results.accountTypes = true;
    console.log("✅ Account types seeded successfully");

    console.log("👤 Creating super admin...");
    const { superAdmin } = await runWithSession("createDefaultSuperAdmin", (session) => createDefaultSuperAdmin({ session }));
    console.log(`✅ Super admin created successfully (SuperAdmin: ${String(superAdmin)})`);

    console.log("💰 Seeding plans...");
    await runWithSession("seedPlans", (session) => seedPlans({ superAdminId: superAdmin, session }));
    results.plans = true;
    console.log("✅ Plans seeded successfully");

    console.log("👤 Creating admin...");
    const { admin, companyId } = await runWithSession("createDefaultAdmin", (session) => createDefaultAdmin({ superAdminId: superAdmin, session }));
    results.users = { admin, superAdmin, companyId };
    console.log(`✅ Admin created successfully (Admin: ${String(admin)}, Company: ${String(companyId)})`);

    console.log("📋 Seeding chart accounts...");
    await runWithSession("seedChartOfAccounts", (session) => seedChartOfAccounts({ companyId, userId: admin, session }));
    results.chartAccounts = true;
    console.log("✅ Chart accounts seeded successfully");

    
    console.log("🎉 Default data initialization completed");
    return { success: true, errors, results, skip: false };
  } catch (error) {
    const errorMsg = `Seeder failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
    return { success: false, errors, results, skip: false };
  }
};

export default Seeder;