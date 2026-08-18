import { ClientSession } from "mongoose";

import AccountDetailType from "models/accountDetailType.model";
import AccountTypeModel from "models/AccountType.model";

import { AppError } from "middlewares/error";
import { defaultChartsDetailTypeidIds } from "../services/Accounttypes.service";

type DetailTypeMap = Map<string, any>;
type AccountTypeMap = Map<string, any>;

interface DetailAccountTypeMapResult {
  detailTypeMap: DetailTypeMap;
  accountTypeMap: AccountTypeMap;
}

const detailAccountTypeMap = async ({
  session,
}: {
  session: ClientSession;
}): Promise<DetailAccountTypeMapResult> => {
  /* ----------------------------------------------------
   * 1️⃣ Extract unique detail type IDs
   * -------------------------------------------------- */
  const detailTypeIds = [
    ...new Set(
      defaultChartsDetailTypeidIds.map((item) =>
        String(item.detailTypeId)
      )
    ),
  ];

  if (!detailTypeIds.length) {
    throw new AppError("No detail type IDs provided", 500);
  }

  /* ----------------------------------------------------
   * 2️⃣ Fetch Account Detail Types
   * -------------------------------------------------- */
  const detailTypes = await AccountDetailType.find({
    detailTypeId: { $in: detailTypeIds },
  })
    .lean()
    .session(session);

  /* ----------------------------------------------------
   * 3️⃣ Validate missing detail types
   * -------------------------------------------------- */
  const foundDetailTypeIds = new Set(
    detailTypes.map((item) => String(item.detailTypeId))
  );

  const missingDetailTypes = detailTypeIds.filter(
    (id) => !foundDetailTypeIds.has(id)
  );

  if (missingDetailTypes.length) {
    throw new AppError(
      `Missing AccountDetailTypes: ${missingDetailTypes.join(", ")}`,
      500
    );
  }

  /* ----------------------------------------------------
   * 4️⃣ Create Detail Type Map
   * -------------------------------------------------- */
  const detailTypeMap: DetailTypeMap = new Map(
    detailTypes.map((item) => [String(item.detailTypeId), item])
  );

  /* ----------------------------------------------------
   * 5️⃣ Extract unique AccountType IDs
   * -------------------------------------------------- */
  const accountTypeIds = [
    ...new Set(
      detailTypes.map((item) => String(item.AccountTypeId))
    ),
  ];

  /* ----------------------------------------------------
   * 6️⃣ Fetch Account Types
   * -------------------------------------------------- */
  const accountTypes = await AccountTypeModel.find({
    _id: { $in: accountTypeIds },
  })
    .lean()
    .session(session);

  /* ----------------------------------------------------
   * 7️⃣ Validate missing account types
   * -------------------------------------------------- */
  const foundAccountTypeIds = new Set(
    accountTypes.map((item) => String(item._id))
  );

  const missingAccountTypes = accountTypeIds.filter(
    (id) => !foundAccountTypeIds.has(id)
  );

  if (missingAccountTypes.length) {
    throw new AppError(
      `Missing AccountTypes: ${missingAccountTypes.join(", ")}`,
      500
    );
  }

  /* ----------------------------------------------------
   * 8️⃣ Create Account Type Map
   * -------------------------------------------------- */
  const accountTypeMap: AccountTypeMap = new Map(
    accountTypes.map((item) => [String(item._id), item])
  );

  return {
    detailTypeMap,
    accountTypeMap,
  };
};

export default detailAccountTypeMap;