import { IAccountTypeEnum, masterType } from "models/AccountType.model";
import { Types } from "mongoose";

export type NormalBalanceSide = "debit" | "credit";

// ======================================================
// CHILD ACCOUNT DATA
// ======================================================

export interface IBalanceSheetData {
  _id: Types.ObjectId;
  name: string;
  masterType: masterType;
  typeId?: string;
  type: IAccountTypeEnum;
  normalBalanceSide: NormalBalanceSide;
  endingBalance: number;
  totalCredits: number;
  totalDebits: number;
}

// ======================================================
// GROUPED ACCOUNT TYPE DATA
// ======================================================

export interface IBalanceSheetGroup {
  _id: Types.ObjectId;
  name: string;
  type: IAccountTypeEnum;
  typeId?: string;
  masterType: masterType;
  normalBalanceSide: NormalBalanceSide;
  data: IBalanceSheetData[];
  totalCredits: number;
  totalDebits: number;
  endingBalance: number;
}

// ======================================================
// TOTALS
// ======================================================

export interface IBalanceSheetTotals {
  TotalAssets: number;
  TotalLiabilities: number;
  TotalEquity: number;
  TotalLiabilitiesAndEquity: number;
}

// ======================================================
// FINAL REPORT
// ======================================================

export interface IBalanceSheetReportData {
  Assets: IBalanceSheetGroup[];
  Liabilities: IBalanceSheetGroup[];
  Equity: IBalanceSheetGroup[];
  totals: IBalanceSheetTotals;
}