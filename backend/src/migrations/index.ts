import { syncAllModelIndexes } from "config/modelSync";
import { migrateChartOfAccounts } from "./chartOfAccountsMigration";

export interface MigrationOptions {
  skipIndexSync?: boolean;
  skipChartOfAccountsMigration?: boolean;
}

export interface MigrationResult {
  success: boolean;
  errors: string[];
  results: {
    indexSync?: boolean;
    chartOfAccountsMigration?: {
      companiesProcessed: number;
    };
  };
}

const runMigrations = async (options: MigrationOptions = {}): Promise<MigrationResult> => {
  const errors: string[] = [];
  const results: MigrationResult["results"] = {};

  try {
    console.log("🚀 [Migration] Starting migrations...");
    // ============================================
    // 1. DATABASE INDEXES
    // ============================================
    if (!options.skipIndexSync) {
      try {
        console.log("🔄 [Migration] Syncing model indexes...");
        await syncAllModelIndexes();
        results.indexSync = true;
        console.log("✅ [Migration] Model indexes synced");
      } catch (error) {
        const errorMsg = `Index sync failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ [Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } else {
      console.log("⏭️  [Migration] Skipping index sync");
    }

  
    // ============================================
    // 2. CHART OF ACCOUNTS MIGRATION
    // ============================================
    if (!options.skipChartOfAccountsMigration) {
      try {
        console.log("\n🔄 [Migration] Running chart of accounts migration...");
        const migrationResult = await migrateChartOfAccounts();
        results.chartOfAccountsMigration = {
          companiesProcessed: migrationResult.companiesProcessed,
        };
        console.log("✅ [Migration] Chart of accounts migration completed");
      } catch (error) {
        const errorMsg = `Chart of accounts migration failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ [Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } else {
      console.log("⏭️  [Migration] Skipping chart of accounts migration");
    }
   

    //  update product service of all sevice 
    
    return {
      success: errors.length === 0,
      errors,
      results,
    };
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ [Migration] ${errorMsg}`);
    return {
      success: false,
      errors: [errorMsg],
      results,
    };
  }
};

export default runMigrations;
