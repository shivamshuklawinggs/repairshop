import { AppError } from "middlewares/error";
import EstimateModal from "models/estimate.model";
import LedgerTransaction, { LedgerTransactionModel, TransactionType } from "models/Ledger.model";
import { IInvoiceBilExpense, IInvoiceBilSummary } from "models/shared/schemas";
import { ITaxService } from "models/tax.model";
import { ClientSession, Model, Types } from "mongoose";
import { IInvoiceBilExpenseLedger } from "./ledgerHelpers";
import { defaultChartsDetailTypeidIdsEnum } from "microservices/chart-accounts-services/services/Accounttypes.service";
import { round2 } from "helpers/round";
type UpdateTotalReceivedParams = {
  model: Model<any>;
  ids: Types.ObjectId[];
  session: ClientSession;
  transactionType: TransactionType.INVOICE | TransactionType.BILL,

};
type AccountType = "EXPENSE" | "REVENUE";

interface CalculateAccountsInput {
  items: IInvoiceBilExpenseLedger[];
  discountPercent?: number;
  
  accountType: AccountType;
  accountMap: Record<string, number>;
  taxAccounts: Record<string, number>;
  recievedPaymentAmount: {
    recievedPaymentId: Types.ObjectId;
    amount: number;
  }[]
}
interface CalculateEstimateInput {
  id: Types.ObjectId,
  session: ClientSession,

}

export const updateInvoiceOrBill = async ({
  model,
  id,
  expense,
  summary,
  session,
}: {
  model: any;
  id: Types.ObjectId;
  expense: IInvoiceBilExpense[];
  summary: IInvoiceBilSummary;
  session: ClientSession;
}) => {
  await model.updateOne(
    { _id: id },
    {
      $set: {
        expense,
        "summary.subTotal": summary.subTotal,
        "summary.taxTotal": summary.taxTotal,
        "summary.discount": summary.discount,
        "summary.finalAmount": summary.finalAmount,
        "summary.totalRecieved": summary.totalRecieved,
        "summary.balanceDue": summary.balanceDue,
      },
    },
    { session }
  );
};

// ================================
// 1. SAFE BALANCE VALIDATION
// ================================

export const validateBalancedEntries = (
  transactions: LedgerTransaction[]
) => {
  const totalDebit = transactions.reduce(
    (sum, txn) => sum + (txn.debit || 0),
    0
  );

  const totalCredit = transactions.reduce(
    (sum, txn) => sum + (txn.credit || 0),
    0
  );

  const difference =(round2(totalDebit)) - (round2(totalCredit))
  if (difference > 0.001) {
    throw new AppError(
      `Ledger not balanced. Debit=${totalDebit}, Credit=${totalCredit}`,
      400
    );
  }
};

export const calculateWithAccounts = ({
  items,
  discountPercent = 0,
  accountType,
  accountMap,
  taxAccounts,
  recievedPaymentAmount = [],
}: CalculateAccountsInput): {
  expense: IInvoiceBilExpense[];
  summary: IInvoiceBilSummary;
} => {
  let subTotal = 0;
  let taxTotal = 0;
  const updatedItems: IInvoiceBilExpense[] = items
    .filter((item) => item.productservice?._id)
    .map((item) => {
      const grossAmount = round2(item.qty * item.rate);

      // tax calculated on original amount
      let taxAmount = 0;

      if (item.tax?.value && item.tax.ChartOfAccountId) {
        if(accountType==="EXPENSE" && item.tax.ChartOfAccountId.detailTypeData.detailType!==defaultChartsDetailTypeidIdsEnum.PURCHASE_TAX){
          throw new AppError("Invalid tax account: Expense transactions require a Purchase Tax account type", 400);
        }
         else  if(accountType==="REVENUE" && item.tax.ChartOfAccountId.detailTypeData.detailType!==defaultChartsDetailTypeidIdsEnum.SALES_TAX_PAYABLE){
          throw new AppError("Invalid tax account: REVENUE transactions require a Sales Tax account type", 400);
        }
        taxAmount = round2((grossAmount * item.tax.value) / 100);

        const taxKey =
          item.tax.ChartOfAccountId._id.toString();

        taxAccounts[taxKey] = round2((taxAccounts[taxKey] || 0) + taxAmount);
      }

      // account selection
      const accountId =
        accountType === "EXPENSE"
          ? item.productservice?.expenseAccount
          : item.productservice?.incomeAccount;

      if (accountId) {
        const key = accountId.toString();

        accountMap[key] = round2((accountMap[key] || 0) + grossAmount);
      }

      subTotal = round2(subTotal + grossAmount);
      taxTotal = round2(taxTotal + taxAmount);

      return {
        ...item,
        _id: item._id,
        productservice: item.productservice._id!,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        readonly: item.readonly,
        label:item.label,
        isloadExpenses:item.isloadExpenses,
        summary: {
          amount: grossAmount,
          taxAmount,
          total: round2(grossAmount + taxAmount),
        },

        ...(item.tax?._id && {
          tax: item.tax._id,
        }),
      };
    });

  // discount applied after subtotal
  const discount = round2((subTotal * discountPercent) / 100);

  // subtotal - discount + tax
  const finalAmount = round2(subTotal - discount + taxTotal);

  const totalRecieved = round2(
    recievedPaymentAmount.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    )
  );

  const balanceDue = round2(finalAmount - totalRecieved);

  return {
    expense: updatedItems,

    summary: {
      subTotal,
      taxTotal,
      discount,
      finalAmount,
      balanceDue,
      totalRecieved,
    },
  };
};
export const calculateEstimateSummary = async ({
  id,
  session
}: CalculateEstimateInput) => {
  let subTotal = 0;
  let taxTotal = 0;
  const data = await EstimateModal.findById(id).populate<{expense: (IInvoiceBilExpense & {tax?: ITaxService})[]}>([
    {
      path: "expense.tax"
    }
  ]).session(session);
  if (!data) {
    return;
  }
  const updatedItems: IInvoiceBilExpense[] = data.expense
   .map((item) => {
      const amount = round2(item.qty * item.rate);
      // TAX
      let taxAmount = 0;
      if (item.tax?.value) {
        taxAmount = round2((amount * item.tax.value) / 100);
      }

      subTotal = round2(subTotal + amount);
      taxTotal = round2(taxTotal + taxAmount);

      const result: IInvoiceBilExpense = {
        ...item,
        _id: item._id,
        productservice: item.productservice,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        readonly: item.readonly,
        label:item.label,
        isloadExpenses: item.isloadExpenses,
        summary: {
          amount,
          taxAmount,
          total: round2(amount + taxAmount),
        },
      };

      if (item.tax?._id) {
        result.tax = item.tax._id;
      }

      return result as IInvoiceBilExpense
    });

  const discount = data.discountPercent
    ? round2((subTotal * data.discountPercent) / 100)
    : 0;

  const finalAmount = round2(subTotal - discount + taxTotal);
  // ✅ TOTAL RECEIVED (move from DB → here)
  const totalRecieved = round2(data?.recievedPaymentAmount?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0)

  // ✅ BALANCE
  const balanceDue = round2(finalAmount - totalRecieved);
  await EstimateModal.updateOne(
    { _id: id},
    {
      $set: {
        expense:updatedItems,
        "summary.subTotal": subTotal,
        "summary.taxTotal": taxTotal,
        "summary.discount": discount,
        "summary.finalAmount": finalAmount,
        "summary.totalRecieved": totalRecieved,
        "summary.balanceDue": balanceDue,
      },
    },
    { session }
  )
  
};
export const updateTotalReceivedBulk = async ({
  model,
  session,
  transactionType,
  ids
}: UpdateTotalReceivedParams) => {
  await model.updateMany(
    { _id: { $in: ids } },
    [
      {
        $set: {
          // 1️⃣ totalRecieved
          "summary.totalRecieved": {
            $sum: {
              $map: {
                input: { $ifNull: [`$recievedPaymentAmount`, []] },
                as: "payment",
                in: "$$payment.amount"
              }
            }
          }
        }
      },
      {
        $set: {
          // 2️⃣ balanceDue = finalAmount - totalRecieved
          "summary.balanceDue": {
            $subtract: [
              { $ifNull: [`$summary.finalAmount`, 0] },
              { $ifNull: [`$summary.totalRecieved`, 0] }
            ]
          }
        }
      }
    ],
    { session }
  )

  await LedgerTransactionModel.updateMany(
    {
      referenceId: { $in: ids },
      transactionType: transactionType
    },
    [
      {
        $set: {
          // 1️⃣ totalRecieved
          "summary.totalRecieved": {
            $sum: {
              $map: {
                input: { $ifNull: [`$recievedPaymentAmount`, []] },
                as: "payment",
                in: "$$payment.amount"
              }
            }
          }
        }
      },
      {
        $set: {
          // 2️⃣ balanceDue = finalAmount - totalRecieved
          "summary.balanceDue": {
            $subtract: [
              { $ifNull: [`$summary.finalAmount`, 0] },
              { $ifNull: [`$summary.totalRecieved`, 0] }
            ]
          }
        }
      }
    ],
    { session }
  )

};
