import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { Moment } from 'moment';
import { 
  fetchAllSalesStats, 
  fetchAllAccountsPayableStats, 
  fetchAllAccountsReceivableStats, 
  fetchAllExpenseStats,
  fetchAllProfitAndLossStats,
  fetchAllInvoicesAndBillsSummaryStats,
} from '@/redux/Slice/DashboardSlice';
import { Role } from '@/types';

// React Query keys for dashboard
export const dashboardKeys = {
  all: ['dashboard'] as const,
  loadStats: () => [...dashboardKeys.all, 'loadStats'] as const,
  sales: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'sales', fromDate, toDate] as const,
  accountsPayable: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'accountsPayable', fromDate, toDate] as const,
  accountsReceivable: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'accountsReceivable', fromDate, toDate] as const,
  expenses: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'expenses', fromDate, toDate] as const,
  profitAndLoss: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'profitAndLoss', fromDate, toDate] as const,
  invoicesAndBillsSummary: (fromDate?: Moment, toDate?: Moment) => [...dashboardKeys.all, 'invoicesAndBillsSummary', fromDate, toDate] as const,
  loadBreakdown: () => [...dashboardKeys.all, 'loadBreakdown'] as const,
};

// Hook for Sales Stats - preserves Redux dispatch
export const useSalesStatsQuery = (fromDate: Moment, toDate: Moment) => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)

  return useQuery({
    queryKey: dashboardKeys.sales(fromDate, toDate),
    queryFn: async () => {
      const result = await dispatch(fetchAllSalesStats({ fromDate, toDate }));
      console.log("result.payload",result.payload)
      return result.payload;
    },
    enabled: !!fromDate && !!toDate && Boolean(currentCompany),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for Accounts Payable Stats - preserves Redux dispatch
export const useAccountsPayableQuery = (fromDate: Moment, toDate: Moment) => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)

  return useQuery({
    queryKey: dashboardKeys.accountsPayable(fromDate, toDate),
    queryFn: async () => {
      const result = await dispatch(fetchAllAccountsPayableStats({ fromDate, toDate }));
      return result.payload;
    },
    enabled: !!fromDate && !!toDate && Boolean(currentCompany),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for Accounts Receivable Stats - preserves Redux dispatch
export const useAccountsReceivableQuery = (fromDate: Moment, toDate: Moment) => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)

  return useQuery({
    queryKey: dashboardKeys.accountsReceivable(fromDate, toDate),
    queryFn: async () => {
      const result = await dispatch(fetchAllAccountsReceivableStats({ fromDate, toDate }));
      return result.payload;
    },
    enabled: !!fromDate && !!toDate && Boolean(currentCompany),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for Expense Stats - preserves Redux dispatch
export const useExpenseStatsQuery = (fromDate: Moment, toDate: Moment) => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)

  return useQuery({
    queryKey: dashboardKeys.expenses(fromDate, toDate),
    queryFn: async () => {
      const result = await dispatch(fetchAllExpenseStats({ fromDate, toDate }));
      return result.payload;
    },
    enabled: !!fromDate && !!toDate && Boolean(currentCompany),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for Profit and Loss Stats - preserves Redux dispatch
export const useProfitAndLossQuery = (fromDate: Moment, toDate: Moment) => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)

  return useQuery({
    queryKey: dashboardKeys.profitAndLoss(fromDate, toDate),
    queryFn: async () => {
      const result = await dispatch(fetchAllProfitAndLossStats({ fromDate, toDate }));
      return result.payload;
    },
    enabled: !!fromDate && !!toDate && Boolean(currentCompany), 
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for Invoices and Bills Summary Stats - preserves Redux dispatch
export const useInvoicesAndBillsSummaryQuery = () => {
  const dispatch = useAppDispatch();
  const currentCompany=useAppSelector((state)=>state.user.currentCompany)
  return useQuery({
    queryKey: dashboardKeys.invoicesAndBillsSummary(),
    queryFn: async () => {
      const result = await dispatch(fetchAllInvoicesAndBillsSummaryStats());
      return result.payload;
    },
    enabled:Boolean(currentCompany),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

