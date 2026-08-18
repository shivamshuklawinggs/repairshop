
const allowedTypes = ["profit-and-loss", "profit-and-loss-month", "balance-sheet", "AccountsReceiveable", "AccountsPayable", "AccountsPayableDetail", "AccountsRecieveableDetail", "TrialBalanceReport", "GeneralLedgerReport", "CreditNotesReport", "DebitNotesReport"] as const
export type allowedreports = typeof allowedTypes[number]
export type allowedAccounts = "Income" | "Expense" | "Cost of Goods Sold" | "Other Income" | "Other Expense" | "Fixed Assets" | "Other Assets" | "Bank" | "Credit Card" | "Accounts receivable (A/R)" | "Other Current Assets" | "Equity" | "Long Term Liabilities" | "Accounts payable (A/P)" | "Other Current Liabilities"
export type allowedType = "month" | "all"
export const excludedReports: readonly allowedreports[] = [
  "profit-and-loss",
  "balance-sheet",
  "TrialBalanceReport",
  "GeneralLedgerReport",
];
export const IncludedSettleAmt: readonly allowedreports[] = [
   "AccountsPayable",
   "AccountsReceiveable"
];


export const LookupAliases = {
  INVOICES: 'accountsinvoices',
  BILLS: 'vendorbills',
  TAX_EXPENSES: 'taxexpenses',
  PAYMENTS: 'accountspayments',
  JOURNAL_ENTRIES: 'journalentries',
  SALES_TAX: 'salesTax',
  SALES_DISCOUNTS: 'salesDiscounts',
  PURCHASE_DISCOUNTS: 'purchaseDiscounts',
  PURCHASE_TAX: 'purchaseTax'
} as const;
export type LookupAliasesNames = typeof LookupAliases[keyof typeof LookupAliases];