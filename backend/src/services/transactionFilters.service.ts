import { Types } from 'mongoose';
import { PaymentStatus, getPaymentStatusMatch } from './paymentQueryBuilder';
import DateTimeFilter from 'utils/postedadate';

export interface TransactionFilterParams {
  search?: string;
  paymentStatus?: PaymentStatus;
  emailStatus?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: string;
  maxAmount?: string;
  customerId?: string;
  vendorId?: string;
  carrierId?: string;
}

/**
 * Build MongoDB match stage for transaction filters
 * Used for filtering invoices, bills, and estimates
 */
export const buildTransactionFilters = (filters: TransactionFilterParams): Record<string, any> => {
  const matchStage: Record<string, any> = {};

  // Search filter - searches by invoice/bill number and customer/vendor name
  if (filters.search) {
    matchStage.$or = [
      { invoiceNumber: { $regex: filters.search, $options: 'i' } },
      { BillNumber: { $regex: filters.search, $options: 'i' } },
    ];
  }

  // Payment status filter
  if (filters.paymentStatus) {
    Object.assign(matchStage, getPaymentStatusMatch(filters.paymentStatus));
  }

  // Email status filter (for invoices)
  if (filters.emailStatus) {
    matchStage.emailStatus = filters.emailStatus;
  }

  // Date range filter
  DateTimeFilter.FilterByDate({fromDate:filters.fromDate,toDate:filters.toDate,field:"dueDate",initialMatchStage:matchStage})

  // Amount range filter
  if (filters.minAmount || filters.maxAmount) {
    const amountFilter: Record<string, any> = {};
    if (filters.minAmount) {
      amountFilter.$gte = parseFloat(filters.minAmount);
    }
    if (filters.maxAmount) {
      amountFilter.$lte = parseFloat(filters.maxAmount);
    }
    matchStage['summary.finalAmount'] = amountFilter;
  }

  // Customer/Vendor/Carrier filter
  if (filters.customerId) {
    matchStage.customerId = new Types.ObjectId(filters.customerId);
  }
  if (filters.vendorId || filters.carrierId) {
    const vendorId = filters.vendorId || filters.carrierId;
    matchStage.vendorId = new Types.ObjectId(vendorId);
  }

  return matchStage;
};

/**
 * Merge transaction filters with base match stage
 * Used to combine company ID and other base conditions with filters
 */
export const mergeWithBaseFilters = (
  baseStage: Record<string, any>,
  filters: TransactionFilterParams
): Record<string, any> => {
  const transactionFilters = buildTransactionFilters(filters);
  
  // Merge the base stage with transaction filters
  const mergedStage = { ...baseStage };
  
  // Handle $or merging properly
  if (transactionFilters.$or) {
    if (mergedStage.$or) {
      mergedStage.$or = [...mergedStage.$or, ...transactionFilters.$or];
    } else {
      mergedStage.$or = transactionFilters.$or;
    }
    delete transactionFilters.$or;
  }
  
  // Merge remaining conditions
  Object.assign(mergedStage, transactionFilters);
  
  return mergedStage;
};
