import { ClientSession, Types } from 'mongoose';
import ChartOfAccount, { IChartOfAccount } from '../models/chartOfAccounts.model';
import { masterType } from '../models/AccountType.model';
import InvoiceModel from '../models/Invoice.model';
import BillModal from '../models/Bill.model';
import JournalEntry, { IJournalEntry } from '../models/journal-entry.model';
import PaymentModal from '../models/payment.model';
import { EntryType, LedgerTransaction, ReferenceType, TransactionType } from '../models/Ledger.model';

import { AppError } from 'middlewares/error';
import { calculateWithAccounts, updateInvoiceOrBill, updateTotalReceivedBulk } from './CalculateInvoiceBillInput';
import { defaultChartsDetailTypeidIdsEnum, defaultChartsDetailTypeidIds, } from 'microservices/chart-accounts-services/services/Accounttypes.service';
import { IProductService } from 'models/product-service.model';
import { ITaxService } from 'models/tax.model';
import { IInvoiceExpenseSummary } from 'models/shared/schemas';
import Counter from 'models/universalid.model';
import { disableImmutableFields } from 'utils/disableImmutableFields';
interface ITaxWithChartAccount extends Omit<ITaxService, 'ChartOfAccountId'> {
  ChartOfAccountId: IChartOfAccount;
}

export interface IInvoiceBilExpenseLedger {
  _id: Types.ObjectId;
  productservice: IProductService;
  description: string;
  qty: number;
  rate: number;
  tax?: ITaxWithChartAccount;
  readonly: boolean;
  isloadExpenses?: boolean;
  label?: string
  summary?: IInvoiceExpenseSummary;
}
export async function getMasterAccount(
  type: masterType,
  companyId: Types.ObjectId
): Promise<string | null> {
  const account = await ChartOfAccount.findOne({ masterType: type, companyId, SystemAccount: true });
  const accountId = account?._id?.toString() || null;
  return accountId;
}

export async function getOrCreateDiscountChartAccount(
  detailType: defaultChartsDetailTypeidIdsEnum,
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  session: ClientSession
): Promise<Types.ObjectId> {
  // First try to find existing chart account
  const existingAccount = await ChartOfAccount.findOne({
    "detailTypeData.detailType": detailType,
    companyId,
    SystemAccount: true,
    readonly: true
  }).select("_id").session(session);

  if (existingAccount) {
    return existingAccount._id;
  }

  // If not found, create the chart account using the seeder logic
  const defaultItem = defaultChartsDetailTypeidIds.find(item => item.detailType === detailType);
  if (!defaultItem) {
    throw new AppError(`Default chart account configuration not found for ${detailType}`, 400);
  }

  // Get the detail type and account type mappings
  const detailAccountTypeMap = await import('microservices/chart-accounts-services/helpers/detailAccountTypeMap');
  const { detailTypeMap, accountTypeMap } = await detailAccountTypeMap.default({ session });

  const detailDoc = detailTypeMap.get(String(defaultItem.detailTypeId));
  if (!detailDoc) {
    throw new AppError(`Detail type not found for ${detailType}`, 400);
  }

  const accountTypeDoc = accountTypeMap?.get(String(detailDoc.AccountTypeId));
  if (!accountTypeDoc) {
    throw new AppError(`Account type not found for ${detailType}`, 400);
  }

  // Determine prefix based on account type
  const prefix = accountTypeDoc.type === 'ASSET' || accountTypeDoc.type === 'LIABILITY' || accountTypeDoc.type === 'EQUITY'
    ? "BAL-"
    : "PL-";

  // Generate unique ID
  const counter = await Counter.findOneAndUpdate(
    { prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  const chartAccountId = `${prefix}${counter.seq}`;

  // Create the chart account
  const newChartAccount = {
    typeId: detailDoc.typeId,
    name: defaultItem.detailType,
    accountType: detailDoc.AccountTypeId,
    masterType: detailDoc.masterType,
    detailType: detailDoc._id,
    isSubAccount: false,
    AccountId: null,
    description: `${defaultItem.detailType} (auto-created for discount)`,
    isActive: true,
    updatedBy: userId,
    createdBy: userId,
    companyId,
    id: chartAccountId,
    type: detailDoc.type,
    accountTypeData: accountTypeDoc,
    detailTypeData: detailDoc,
    isLoad: defaultItem.detailType === defaultChartsDetailTypeidIdsEnum.LOAD_SALES || defaultItem.detailType === defaultChartsDetailTypeidIdsEnum.LOAD_EXPENSES,
    readonly: true,
    SystemAccount: true,
  };

  const { restore } = disableImmutableFields(ChartOfAccount);
  const createdAccount = await ChartOfAccount.create([newChartAccount], { session });
  restore();

  if (!createdAccount || createdAccount.length === 0) {
    throw new AppError(`Failed to create chart account for ${detailType}`, 500);
  }

  return createdAccount[0]._id;
}

export async function getDocumentByType(
  type: TransactionType.BILL | TransactionType.INVOICE | TransactionType.PAYMENT | TransactionType.JOURNAL,
  id: Types.ObjectId,
  companyId: Types.ObjectId,
  session: ClientSession
): Promise<Array<LedgerTransaction>> {
  const revenueAccounts: Record<string, number> = {};
  const expenseAccounts: Record<string, number> = {};
  const taxAccounts: Record<string, number> = {};
  const transactions: LedgerTransaction[] = [];
  switch (type) {
    case TransactionType.BILL:
      const billDoc = await BillModal
        .findOne({ _id: id, companyId }).session(session)
        .populate<{ expense: Array<IInvoiceBilExpenseLedger> }>({
          path: "expense",
          populate: [
            {
              path: "tax",
              populate: {
                path: "ChartOfAccountId",
              },
            },
            {
              path: "productservice",
            },
          ],
        })
        .lean();

      if (!billDoc || !billDoc.expense?.length) return []

      const payableAccountId = await getMasterAccount(masterType.vendor, companyId);
      if (!payableAccountId) throw new Error("Receivable account not found");
      const { summary, expense: BillExpense } = calculateWithAccounts({
        items: billDoc.expense,
        discountPercent: billDoc.discountPercent,
        accountType: "EXPENSE",
        accountMap: expenseAccounts,
        taxAccounts,
        recievedPaymentAmount: billDoc.recievedPaymentAmount ?? []
      });

      const { finalAmount: billFinalAmount, discount: billDiscount } = summary;
      await updateInvoiceOrBill({
        model: BillModal,
        id: billDoc._id,
        expense: BillExpense,
        summary: summary,
        session,
      });
      // discount
      if (billDoc.discountPercent && billDoc.discountPercent > 0) {
        const accountId = await getOrCreateDiscountChartAccount(
          defaultChartsDetailTypeidIdsEnum.DISCOUNTS_RECEIVED,
          billDoc.companyId,
          billDoc.createdBy,
          session
        );
        if (!accountId) {
          throw new AppError(`Failed To Get ${defaultChartsDetailTypeidIdsEnum.DISCOUNTS_RECEIVED} Chart Of Account`, 400)
        }
        transactions.push(
          {
            transactionType: TransactionType.DISCOUNT,
            type: ReferenceType.PURCHASE_DISCOUNT,
            referenceId: id,
            amount: billDiscount,
            entryType: EntryType.CREDIT,
            accountId: accountId,
            postingDate: billDoc.postingDate,
            companyId: billDoc.companyId,
            createdBy: billDoc.createdBy,
            updatedBy: billDoc.updatedBy,
            vendorId: billDoc.vendorId,
            debit: 0,
            credit: billDiscount,
            description: `Bill ${billDoc.BillNumber} - Discount`,
            refrenceNo: billDoc.BillNumber,
            lastPaymentDate: billDoc.lastPaymentDate ? billDoc.lastPaymentDate : undefined,
            summary: summary
          }
        );
      }
      // Add payable entry (debit for total amount including tax)
      if (payableAccountId) {
        transactions.push(
          {
            transactionType: TransactionType.BILL,
            type: ReferenceType.BILL,
            referenceId: id,
            amount: billFinalAmount,
            entryType: EntryType.CREDIT,
            accountId: payableAccountId as unknown as Types.ObjectId,
            postingDate: billDoc.postingDate,
            companyId: billDoc.companyId, createdBy: billDoc.createdBy, updatedBy: billDoc.updatedBy,
            vendorId: billDoc.vendorId,
            credit: billFinalAmount,
            debit: 0,
            description: `Bill ${billDoc.BillNumber} - Payable`,
            refrenceNo: billDoc.BillNumber,
            totalRecieved: summary.totalRecieved,
            balanceDue: summary.balanceDue,
            summary: summary,
            dueDate: billDoc.dueDate,
            lastPaymentDate: billDoc.lastPaymentDate ? billDoc.lastPaymentDate : undefined
          }
        );
      }
      // Add expense entries (credit for each income account)
      Object.entries(expenseAccounts).forEach(([accountId, amount]) => {

        transactions.push({
          accountId: accountId as unknown as Types.ObjectId,
          transactionType: TransactionType.BILL,
          type: ReferenceType.BILL,
          referenceId: billDoc._id,
          amount,
          entryType: EntryType.DEBIT,
          postingDate: billDoc.postingDate,
          companyId: billDoc.companyId, createdBy: billDoc.createdBy, updatedBy: billDoc.updatedBy,
          vendorId: billDoc.vendorId,
          debit: amount,
          credit: 0,
          description: `Bill ${billDoc.BillNumber} - Expense`,
          refrenceNo: billDoc.BillNumber,
          lastPaymentDate: billDoc.lastPaymentDate ? billDoc.lastPaymentDate : undefined,
          summary: summary,
        });

      });

      // Add tax entries (credit for each tax account)
      Object.entries(taxAccounts).forEach(([accountId, amount]) => {

        transactions.push({
          accountId: accountId as unknown as Types.ObjectId,
          transactionType: TransactionType.TAX,
          type: ReferenceType.PURCHASE_TAX,
          referenceId: billDoc._id,
          amount,
          entryType: EntryType.DEBIT,
          description: `Bill ${billDoc.BillNumber} - Tax`,
          postingDate: billDoc.postingDate,
          companyId: billDoc.companyId, createdBy: billDoc.createdBy, updatedBy: billDoc.updatedBy,
          vendorId: billDoc.vendorId,
          debit: amount,
          credit: 0,
          refrenceNo: billDoc.BillNumber,
          lastPaymentDate: billDoc.lastPaymentDate ? billDoc.lastPaymentDate : undefined,
          summary: summary,
        });

      });
      
      return transactions
    case TransactionType.INVOICE:
      const InvoiceDoc = await InvoiceModel
        .findOne({ _id: id, companyId }).session(session)
        .populate<{ expense: Array<IInvoiceBilExpenseLedger> }>({
          path: "expense",
          populate: [
            {
              path: "tax",
              populate: {
                path: "ChartOfAccountId",
              },
            },
            {
              path: "productservice",
            },
          ],
        })
        .lean();

      if (!InvoiceDoc || !InvoiceDoc.expense?.length) return []

      const receivableAccountId = await getMasterAccount(masterType.customer, companyId);
      if (!receivableAccountId) throw new Error("Receivable account not found");
      const { summary: Invoicesummary, expense: InvoiceExpense } = calculateWithAccounts({
        items: InvoiceDoc.expense,
        discountPercent: InvoiceDoc.discountPercent,
        accountType: "REVENUE",
        accountMap: revenueAccounts,
        taxAccounts,
        recievedPaymentAmount: InvoiceDoc.recievedPaymentAmount ?? []
      });

      const { finalAmount: invoiceFinalAmount, discount: invoiceDiscount } = Invoicesummary;
      await updateInvoiceOrBill({
        model: InvoiceModel,
        id: InvoiceDoc._id,
        expense: InvoiceExpense,
        summary: Invoicesummary,
        session,
      });
      // discount
      if (InvoiceDoc.discountPercent && InvoiceDoc.discountPercent > 0) {
        const accountId = await getOrCreateDiscountChartAccount(
          defaultChartsDetailTypeidIdsEnum.DISCOUNTS_GIVEN,
          InvoiceDoc.companyId,
          InvoiceDoc.createdBy,
          session
        );
        if (!accountId) {
          throw new AppError(`Failed To Get ${defaultChartsDetailTypeidIdsEnum.DISCOUNTS_GIVEN} Chart Of Account`, 400)
        }
        transactions.push(
          {
            transactionType: TransactionType.DISCOUNT,
            type: ReferenceType.SALES_DISCOUNT,
            referenceId: id,
            amount: invoiceDiscount,
            entryType: EntryType.DEBIT,
            accountId: accountId,
            postingDate: InvoiceDoc.postingDate,
            companyId: InvoiceDoc.companyId,
            createdBy: InvoiceDoc.createdBy,
            updatedBy: InvoiceDoc.updatedBy,
            customerId: InvoiceDoc.customerId,
            debit: invoiceDiscount,
            credit: 0,
            description: `Invoice ${InvoiceDoc.invoiceNumber} - Discount`,
            refrenceNo: InvoiceDoc.invoiceNumber,
            lastPaymentDate: InvoiceDoc.lastPaymentDate ? InvoiceDoc.lastPaymentDate : undefined,
            summary: Invoicesummary,
          }
        );
      }

      // Add receivable entry (debit for total amount including tax)
      if (receivableAccountId) {
        transactions.push(
          {
            transactionType: TransactionType.INVOICE,
            type: ReferenceType.INVOICE,
            referenceId: id,
            amount: invoiceFinalAmount,
            entryType: EntryType.DEBIT,
            accountId: receivableAccountId as unknown as Types.ObjectId,
            postingDate: InvoiceDoc.postingDate,
            companyId: InvoiceDoc.companyId, createdBy: InvoiceDoc.createdBy, updatedBy: InvoiceDoc.updatedBy,
            customerId: InvoiceDoc.customerId,
            debit: invoiceFinalAmount,
            credit: 0,
            description: `Invoice ${InvoiceDoc.invoiceNumber} - Receivable`,
            refrenceNo: InvoiceDoc.invoiceNumber,
            totalRecieved: Invoicesummary.totalRecieved,
            balanceDue: Invoicesummary.balanceDue,
            summary: Invoicesummary,
            dueDate: InvoiceDoc.dueDate,
            lastPaymentDate: InvoiceDoc.lastPaymentDate ? InvoiceDoc.lastPaymentDate : undefined
          }
        );
      }
      // Add revenue entries (credit for each income account)
      Object.entries(revenueAccounts).forEach(([accountId, amount]) => {

        transactions.push({
          accountId: accountId as unknown as Types.ObjectId,
          transactionType: TransactionType.INVOICE,
          type: ReferenceType.INVOICE,
          referenceId: InvoiceDoc._id,
          amount,
          entryType: EntryType.CREDIT,
          postingDate: InvoiceDoc.postingDate,
          companyId: InvoiceDoc.companyId, createdBy: InvoiceDoc.createdBy, updatedBy: InvoiceDoc.updatedBy,
          customerId: InvoiceDoc.customerId,
          credit: amount,
          debit: 0,
          description: `Invoice ${InvoiceDoc.invoiceNumber} - Revenue`,
          refrenceNo: InvoiceDoc.invoiceNumber,
          lastPaymentDate: InvoiceDoc.lastPaymentDate ? InvoiceDoc.lastPaymentDate : undefined,
          summary: Invoicesummary,
        });

      });

      // Add tax entries (credit for each tax account)
      Object.entries(taxAccounts).forEach(([accountId, amount]) => {

        transactions.push({
          accountId: accountId as unknown as Types.ObjectId,
          transactionType: TransactionType.TAX,
          type: ReferenceType.SALES_TAX,
          referenceId: InvoiceDoc._id,
          amount,
          entryType: EntryType.CREDIT,
          description: `Invoice ${InvoiceDoc.invoiceNumber} - Tax`,
          postingDate: InvoiceDoc.postingDate,
          companyId: InvoiceDoc.companyId, createdBy: InvoiceDoc.createdBy, updatedBy: InvoiceDoc.updatedBy,
          customerId: InvoiceDoc.customerId,
          credit: amount,
          refrenceNo: InvoiceDoc.invoiceNumber,
          debit: 0,
          lastPaymentDate: InvoiceDoc.lastPaymentDate ? InvoiceDoc.lastPaymentDate : undefined,
          summary: Invoicesummary,
        });

      });
     
      return transactions
    case TransactionType.JOURNAL:
      const journalData = await JournalEntry.findOne(
        {
          _id: id,
          companyId: companyId
        }
      ).session(session).lean()
      if (!journalData) return []
      // Process each entry in the journal entry
      journalData.entries.forEach((entry: IJournalEntry["entries"][0], index) => {
        // Only process entries that have either debit or credit amount

        if (entry.debit > 0) {
          const entryData: LedgerTransaction = {
            accountId: entry.account,
            companyId: companyId,
            postingDate: journalData.postingDate,
            createdBy: journalData.createdBy,
            transactionType: TransactionType.JOURNAL,
            type: ReferenceType.JOURNAL_ENTRY,
            referenceId: journalData._id,
            amount: entry.debit,
            debit: entry.debit,
            credit: entry.credit,
            entryType: EntryType.DEBIT,
            refrenceNo: journalData.journalNumber,
            description: entry.description || `Journal Entry ${journalData.journalNumber} - Debit Entry ${index + 1}`,
          }
          if (entry.nameModel == "Customer") {
            entryData.customerId = entry.nameId
          } else if (entry.nameModel == "Carrier") {
            entryData.vendorId = entry.nameId
          }
          transactions.push(entryData);
        }

        if (entry.credit > 0) {
          const entryData: LedgerTransaction = {
            accountId: entry.account as Types.ObjectId,
            companyId: companyId as Types.ObjectId,
            postingDate: journalData.postingDate,
            createdBy: journalData?.createdBy as Types.ObjectId,
            transactionType: TransactionType.JOURNAL,
            type: ReferenceType.JOURNAL_ENTRY,
            referenceId: journalData._id as Types.ObjectId,
            amount: entry.credit,
            entryType: EntryType.CREDIT,
            debit: entry.debit,
            refrenceNo: journalData.journalNumber,
            credit: entry.credit,
            description: entry.description || `Journal Entry ${journalData.journalNumber} - Credit Entry ${index + 1}`,
          }

          if (entry.nameModel == "Customer") {
            entryData.customerId = entry.nameId
          } else if (entry.nameModel == "Carrier") {
            entryData.vendorId = entry.nameId
          }
          transactions.push(entryData);
        }
      });
      return transactions
    case TransactionType.PAYMENT:
      const paymentDoc = await PaymentModal
        .findOne({ _id: id, companyId }).session(session)
        .lean();
      if (!paymentDoc) return [];
      const amount = paymentDoc.amount || 0;
      // Get the cash/bank account ID
      const cashAccountId = paymentDoc.depositTo
      if (!cashAccountId) {
        throw new AppError('Missing deposit account ID for ledger entry', 400);
      }
      // Handle based on payment type
      if (paymentDoc.PaymentType === 'invoice') {
        // Customer payment (invoice)
        const receivableAccountId = await getMasterAccount(masterType.customer, companyId)
        if (!receivableAccountId) {
          throw new AppError('Missing receivable account ID for customer payment', 400);
        }
        // Add receivable entry (credit)
        transactions.push({
          accountId: receivableAccountId as unknown as Types.ObjectId,
          companyId,
          createdBy: paymentDoc.createdBy,
          postingDate: paymentDoc.postingDate || new Date(),
          transactionType: TransactionType.PAYMENT,
          type: ReferenceType.INVOICE_PAYMENT,
          referenceId: paymentDoc._id,
          amount,
          entryType: EntryType.CREDIT,
          customerId: paymentDoc.customerId,
          description: `Payment received: ${paymentDoc.referenceNo}`,
          debit: 0,
          refrenceNo: paymentDoc.referenceNo,
          credit: amount,
          credits: paymentDoc.credits,
          settledAmount: paymentDoc.settledAmount,
          txnstatus: paymentDoc.status,
          summary: {
            settledAmount: paymentDoc.settledAmount,
            finalAmount: paymentDoc.amount,
            credits: paymentDoc.credits,
          }
        });
        // Add cash/bank entry (debit)
        transactions.push({
          accountId: cashAccountId,
          companyId,
          createdBy: paymentDoc.createdBy,
          postingDate: paymentDoc.paymentDate,
          transactionType: TransactionType.PAYMENT,
          type: ReferenceType.INVOICE_PAYMENT,
          referenceId: paymentDoc._id,
          amount,
          debit: amount,
          credit: 0,
          entryType: EntryType.DEBIT,
          customerId: paymentDoc.customerId,
          refrenceNo: paymentDoc.referenceNo,
          description: `Payment received: ${paymentDoc.referenceNo}`,
          credits: paymentDoc.credits,
          settledAmount: paymentDoc.settledAmount,
          txnstatus: paymentDoc.status,
          summary: {
            finalAmount: amount,
            credits: paymentDoc.credits,
            settledAmount: paymentDoc.settledAmount,
          }
        });


        await updateTotalReceivedBulk({
          model: InvoiceModel,
          ids: paymentDoc.invoiceIds ?? [],
          session,
          transactionType: TransactionType.INVOICE
        });
      } else if (paymentDoc.PaymentType === 'bill') {
        // Vendor payment (bill)
        const payableAccountId = await getMasterAccount(masterType.vendor, companyId)
        if (!payableAccountId) {
          throw new AppError('Missing payable account ID for vendor payment', 400);
        }


        // Add payable entry (debit)
        transactions.push({
          accountId: payableAccountId as unknown as Types.ObjectId,
          companyId,
          createdBy: paymentDoc.createdBy,
          postingDate: paymentDoc.paymentDate || new Date(),
          transactionType: TransactionType.PAYMENT,
          type: ReferenceType.BILL_PAYMENT,
          referenceId: paymentDoc._id,
          amount: paymentDoc.amount,
          entryType: EntryType.DEBIT,
          description: `Payment sent: ${paymentDoc.referenceNo}`,
          vendorId: paymentDoc.customerId,
          refrenceNo: paymentDoc.referenceNo,
          debit: amount,
          credits: paymentDoc.credits,
          settledAmount: paymentDoc.settledAmount,
          txnstatus: paymentDoc.status,
          credit: 0,
          summary: {
            finalAmount: amount,
            credits: paymentDoc.credits,
            settledAmount: paymentDoc.settledAmount,
          }
        });

        // Add cash/bank entry (credit)
        transactions.push({
          accountId: cashAccountId,
          companyId,
          createdBy: paymentDoc.createdBy,
          postingDate: paymentDoc.paymentDate || new Date(),
          transactionType: TransactionType.PAYMENT,
          type: ReferenceType.BILL_PAYMENT,
          referenceId: paymentDoc._id,
          amount,
          entryType: EntryType.CREDIT,
          description: `Payment sent: ${paymentDoc.referenceNo}`,
          vendorId: paymentDoc.customerId,
          debit: 0,
          refrenceNo: paymentDoc.referenceNo,
          credit: amount,
          credits: paymentDoc.credits,
          settledAmount: paymentDoc.settledAmount,
          txnstatus: paymentDoc.status,
          summary: {
            finalAmount: amount,
            credits: paymentDoc.credits,
            settledAmount: paymentDoc.settledAmount,
          }
        });
        await updateTotalReceivedBulk({
          model: BillModal,
          ids: paymentDoc.billids ?? [],
          session,
          transactionType: TransactionType.BILL
        });
      }
      return transactions
 
    default:
      throw new Error(`Unsupported transaction type: ${type}`);
  }
}
