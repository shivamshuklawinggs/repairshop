import ChartOfAccount from "models/chartOfAccounts.model";
import Counter from "models/universalid.model";
import { masterType, balanceSheets, profitAndLoss } from "models/AccountType.model";
import detailAccountTypeMap from "microservices/chart-accounts-services/helpers/detailAccountTypeMap";
import { IProductService } from "models/product-service.model";
import { defaultChartsDetailTypeidIds } from "microservices/chart-accounts-services/services/Accounttypes.service";
import { disableImmutableFields } from "utils/disableImmutableFields";
interface Result {
    created: number,
    skipped:number,
    errors:number,
    ProductServies?: IProductService
}
// These masterTypes have a partial unique index on {companyId, masterType}.
// Must match by masterType (not name) to avoid duplicate key on upsert.
const SYSTEM_MASTER_TYPES = new Set([masterType.customer, masterType.vendor, masterType.retainedearnings]);

export const seedChartOfAccounts = async ({
  companyId,
  userId,
  session,
}: any):Promise<Result> => {

  const result: Result = {
    created: 0,
    skipped:0,
    errors:0,
    ProductServies:undefined
  }
  const { detailTypeMap, accountTypeMap } = await detailAccountTypeMap({ session })
  const groupedByPrefix: Record<string, any[]> = {};

  // ✅ Group items
  for (const item of defaultChartsDetailTypeidIds) {
    try {
      const detailDoc = detailTypeMap.get(String(item.detailTypeId));
      if (!detailDoc) continue;
      const prefix = balanceSheets.includes(detailDoc.type)
        ? "BAL-"
        : profitAndLoss.includes(detailDoc.type)
          ? "PL-"
          : "UNK-";

      if (!groupedByPrefix[prefix]) {
        groupedByPrefix[prefix] = [];
      }

      groupedByPrefix[prefix].push({ item, detailDoc });
    } catch (err) {
      result.errors++;
      throw err;
    }
  }

  // ✅ Generate IDs
  const idsMap: Record<string, string[]> = {};

  for (const prefix of Object.keys(groupedByPrefix)) {
    const items = groupedByPrefix[prefix];

    const counter = await Counter.findOneAndUpdate(
      { prefix },
      { $inc: { seq: items.length } },
      { new: true, upsert: true, session }
    );

    const start = counter.seq - items.length + 1;

    idsMap[prefix] = items.map((_, i) =>
      `${prefix}${String(start + i).padStart(5, "0")}`
    );
  }

  // ✅ Bulk insert
  const bulkOps: any[] = [];

  for (const prefix of Object.keys(groupedByPrefix)) {
    const items = groupedByPrefix[prefix];
    const ids = idsMap[prefix];
    items.forEach(({ item, detailDoc }, index) => {
      const accountTypeDoc = accountTypeMap?.get(String(detailDoc.AccountTypeId)) ?? null;
      // System accounts (customer/vendor/retainedearnings) have a partial unique index on
      // {companyId, masterType}. Filtering by masterType ensures we UPDATE the existing
      // document regardless of its current name, preventing a duplicate key on upsert insert.
      const isSystemAccount = SYSTEM_MASTER_TYPES.has(item.masterType);
      const filter = isSystemAccount
        ? { companyId, masterType: item.masterType }
        : { companyId, name: item.detailType };
      bulkOps.push({
        updateOne: {
          filter,
          update: {
            $set: {
              typeId: detailDoc.typeId,
              name: item.detailType,
              accountType: detailDoc.AccountTypeId,
              masterType: detailDoc.masterType,
              detailType: detailDoc._id,
              isSubAccount: false,
              AccountId: null,
              description: `${item.detailType} (auto-seeded)`,
              isActive: true,
              updatedBy: userId,
              type: detailDoc.type,
              accountTypeData: accountTypeDoc,
              detailTypeData: detailDoc,
              readonly:true,
              SystemAccount:true,
            },
            $setOnInsert: {
              createdBy: userId,
              companyId,
              id: ids[index],
            },
          },
          upsert: true,
        },
      });
    });
  }

  if (bulkOps.length > 0) {
    const { restore } = disableImmutableFields(ChartOfAccount)
    await ChartOfAccount.bulkWrite(bulkOps, { session });
    result.created = bulkOps.length;
    restore()
  }
  return result
};