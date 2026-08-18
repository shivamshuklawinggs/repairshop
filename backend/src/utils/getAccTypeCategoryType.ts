export const incomeCategories = ["Income", "Other Income"] as const;
export type IncomeCategory = typeof incomeCategories[number];

export const expenseCategories = [
  "Cost of Goods Sold",
  "Expenses",
  "Other Expense",
] as const;
export type ExpenseCategory = typeof expenseCategories[number];

// --- Assets ---
export const assetCategories = [
  "Accounts receivable (A/R)",
  "Other Current Assets",
  "Bank",
  "Fixed Assets",
  "Other Assets",
] as const;
export type AssetCategory = typeof assetCategories[number];

// --- Liabilities ---
export const liabilityCategories = [
  "Accounts payable (A/P)",
  "Credit Card",
  "Other Current Liabilities",
  "Long Term Liabilities",
] as const;
export type LiabilityCategory = typeof liabilityCategories[number];

// --- Equity ---
export const equityCategories = ["Equity"] as const;
export type EquityCategory = typeof equityCategories[number];

export type AccountCategoryType =
  | "income"
  | "expense"
  | "asset"
  | "liability"
  | "equity";

  export function getCategoryType(name: string): AccountCategoryType {
    if ((incomeCategories as readonly string[]).includes(name)) return "income";
    if ((expenseCategories as readonly string[]).includes(name)) return "expense";
    if ((assetCategories as readonly string[]).includes(name)) return "asset";
    if ((liabilityCategories as readonly string[]).includes(name)) return "liability";
    if ((equityCategories as readonly string[]).includes(name)) return "equity";
    throw new Error(`Unknown account type: ${name}`);
  }
  export const getMasterType=(name:string)=>{
      if(name.toLowerCase().includes("accounts receivable (a/r)")){
          return "customer"
      }
      if(name.toLowerCase().includes("accounts payable (a/p)")){
          return "vendor"
      }
      return "other"
  }
  