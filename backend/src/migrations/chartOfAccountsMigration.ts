import mongoose from "mongoose";
import companyModel from "models/company.model";
import { seedChartOfAccounts } from "seeders/seedChartOfAccounts";

/**
 * Migration to seed chart of accounts for all companies
 * This will:
 * 1. Get all companies (excluding REPAIR type)
 * 2. Seed chart of accounts for each company
 */
export const migrateChartOfAccounts = async () => {
  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    console.log("🚀 [Migration] Starting chart of accounts migration...");
    
    // Get all companies with their prefixes
    const companies = await companyModel
      .find()
      .session(session)
      .lean();

    console.log(`📊 [Migration] Found ${companies.length} companies`);

    let companiesProcessed = 0;

    for (const company of companies) {
      const companyId = company._id;
      await seedChartOfAccounts({
        companyId,
        userId: company.ownerAdminId,
        session,
      })
      companiesProcessed++;
      console.log(`📋 [Migration] Seeded chart of accounts for company ${companyId}`);
    }

    await session.commitTransaction();

    console.log("\n🎉 [Migration] Chart of accounts migration completed successfully!");
    console.log(`📊 [Migration] Summary:`);
    console.log(`   - Companies processed: ${companiesProcessed}`);
    
    return {
      success: true,
      companiesProcessed,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ [Migration] Chart of accounts migration failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};
