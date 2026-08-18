import mongoose from "mongoose";
import { masterType } from "models/AccountType.model";
import { ProfitAndLossTypeIds } from "shared/pipelines/enum";
import ChartOfAccountModel, {
  IChartOfAccount,
} from "models/chartOfAccounts.model";

export const RetainEarningTypeIds = [
  ProfitAndLossTypeIds.income,
  ProfitAndLossTypeIds.costOfGoodsSold,
  ProfitAndLossTypeIds.expense,
  ProfitAndLossTypeIds.otherIncome,
  ProfitAndLossTypeIds.otherExpense,
];

interface BuildMatchRecordParams {
  companyId: string;
  accountId: string;
  chartofAccount: IChartOfAccount;
}

interface BuildMatchRecordResponse {
  matchRecord: Record<string, any>;
  retainedEarningAccountIdsMap: Map<string, boolean>;
  retainedEarningAccountIds: mongoose.Types.ObjectId[];
}

export const buildAccountMatchRecord = async ({
  companyId,
  accountId,
  chartofAccount,
}: BuildMatchRecordParams): Promise<BuildMatchRecordResponse> => {
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const accountObjectId = new mongoose.Types.ObjectId(accountId);

  // always include passed accountId
  let retainedEarningAccountIds: mongoose.Types.ObjectId[] = [
    accountObjectId,
  ];

  const retainedEarningAccountIdsMap = new Map<string, boolean>([
    [accountObjectId.toString(), true],
  ]);

  // default match
  let matchRecord: Record<string, any> = {
    _id: accountObjectId,
    companyId: companyObjectId,
  };

  if (
    chartofAccount &&
    chartofAccount.masterType === masterType.retainedearnings
  ) {
    const retainedAccounts = await ChartOfAccountModel.find(
      {
        companyId: companyObjectId,
        "detailTypeData.typeId": {
          $in: RetainEarningTypeIds,
        },
      },
      { _id: 1 }
    ).lean();

    retainedAccounts.forEach((item) => {
      const id = item._id.toString();

      if (!retainedEarningAccountIdsMap.has(id)) {
        retainedEarningAccountIds.push(
          item._id as mongoose.Types.ObjectId
        );

        retainedEarningAccountIdsMap.set(id, true);
      }
    });

    matchRecord = {
      _id: {
        $in: retainedEarningAccountIds.map((i) => new mongoose.Types.ObjectId(i)),
      },
      companyId: companyObjectId,
    };
  }

  return {
    matchRecord,
    retainedEarningAccountIdsMap,
    retainedEarningAccountIds,
  };
};