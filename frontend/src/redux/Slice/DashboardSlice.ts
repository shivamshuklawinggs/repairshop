import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "@/service/apiService";
import { Dashboardtoday, LastMonth } from "@/pages/dashboard-service/constant";
import { Moment } from "moment";
import { paidtype } from "@/types";


export interface MonthlyRevenue {
  total: number
  count: number
}

export interface AvgRevenuePerLoad {
  total: number
  count: number
}

export interface ActiveDriversData {
  activeDrivers: number
  totalCarrierPay: number
  totalCarrierTotal: number
  totalMargin: number
  totalLoadAmount: number
  loadCount: number
}

export interface MarginChart {
  totalMargin: number
  totalRevenue: number
  avgMarginPerLoad: number
  marginPercentage: number
}

export interface ExpenseChart {
  _id: paidtype
  total: number
}

export interface CashFlowData {
  cashInflows: {
    _id: { year: number; month: number };
    invoiceAmount: number;
    paymentAmount: number;
    totalInflow: number;
    transactionCount: number;
  }[];
  cashOutflows: {
    _id: { year: number; month: number };
    billAmount: number;
    paymentAmount: number;
    totalOutflow: number;
    transactionCount: number;
  }[];
  transactionSummary: {
    _id: string;
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
  }[];
  totals: {
    totalCredits: number;
    totalDebits: number;
    netCashFlow: number;
    transactionCount: number;
  };
}

interface ProfitAndLossTotals {
  _id: string;
  Income: number;
  COGS: number;
  Expenses: number;
  OtherIncome: number;
  OtherExpense: number;
  grossProfit: number;
  netOperatingIncome: number;
  netOtherIncome: number;
  netProfit: number;
}
interface Data {
  totalCredit: number;
  totalDebit: number;
  totalAmount: number;
  accountName: string;
  monthName: string;
  ageInMonths: number;
  total: number;
  year: number;
  month: number;
  totalString: string;
}


export interface DashboardState {
  ProfitAndLossData: Data[];
  ProfitAndLossTotals: ProfitAndLossTotals;
  SalesData: Data[];
  TotalSales: number;
  AccountsReceivable: {
    _id: string;
    currentMonth: number;
    oneMonth: number;
    twoToSixMonths: number;
    greaterThanSixMonths: number;
    totalAmount: number;
  };
  AccountsPayable: {
    _id: string;
    currentMonth: number;
    twoToSixMonths: number;
    oneMonth: number;
    greaterThanSixMonths: number;
    totalAmount: number;
  };
  expenseData: {
    _id: string;
    name: string;
    totalAmount: number;
  }[];
  expenseTotal: number;
  InvoicesAndBillsSummary: {
    invoices: {
      totalInvoices: { count: number; totalAmount: number };
      paidInvoices: { count: number; totalAmount: number };
      overdueInvoices: { count: number; totalAmount: number };
      openInvoices: { count: number; totalAmount: number };
      invoicePayments: { count: number; totalAmount: number };
    };
    bills: {
      totalBills: { count: number; totalAmount: number };
      paidBills: { count: number; totalAmount: number };
      overdueBills: { count: number; totalAmount: number };
      openBills: { count: number; totalAmount: number };
      billPayments: { count: number; totalAmount: number };
    };
  };
  CashFlow: CashFlowData;
  dashboardView: 'normal' | 'loadBreakdown';
  dateFilters: {
    AccPayable: {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
    AccReceivable: {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
    Sales: {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
    Expenses: {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
    "Profit&Loss": {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
    InvoicesAndBillsSummary: {
      fromDate: Moment | null;
      toDate: Moment | null;
      customeDate: boolean;
    };
  };
}

const initialState: {
  dashboard: DashboardState;
  loading: boolean;
  error: string | null;
} = {
  dashboard: {
    ProfitAndLossData: [],
    SalesData: [],
    ProfitAndLossTotals: {
      _id: "ProfitAndLoss",
      Income: 0,
      COGS: 0,
      Expenses: 0,
      OtherIncome: 0,
      OtherExpense: 0,
      grossProfit: 0,
      netOperatingIncome: 0,
      netOtherIncome: 0,
      netProfit: 0,
    },
    TotalSales: 0,
    AccountsReceivable: {
      _id: "AccountsReceivable",
      currentMonth: 0,
      twoToSixMonths: 0,
      greaterThanSixMonths: 0,
      oneMonth: 0,
      totalAmount: 0,
    },
    AccountsPayable: {
      _id: "AccountsPayable",
      currentMonth: 0,
      twoToSixMonths: 0,
      oneMonth: 0,
      greaterThanSixMonths: 0,
      totalAmount: 0,
    },
    expenseData: [],
    expenseTotal: 0,
    InvoicesAndBillsSummary: {
      invoices: {
        totalInvoices: { count: 0, totalAmount: 0 },
        paidInvoices: { count: 0, totalAmount: 0 },
        overdueInvoices: { count: 0, totalAmount: 0 },
        openInvoices: { count: 0, totalAmount: 0 },
        invoicePayments: { count: 0, totalAmount: 0 },
      },
      bills: {
        totalBills: { count: 0, totalAmount: 0 },
        paidBills: { count: 0, totalAmount: 0 },
        overdueBills: { count: 0, totalAmount: 0 },
        openBills: { count: 0, totalAmount: 0 },
        billPayments: { count: 0, totalAmount: 0 },
      },
    },

    CashFlow: {
      cashInflows: [],
      cashOutflows: [],
      transactionSummary: [],
      totals: {
        totalCredits: 0,
        totalDebits: 0,
        netCashFlow: 0,
        transactionCount: 0
      }
    },
    dashboardView: 'normal',
    dateFilters: {
      AccPayable: {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
      AccReceivable: {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
      Sales: {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
      Expenses: {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
      "Profit&Loss": {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
      InvoicesAndBillsSummary: {
        fromDate: LastMonth,
        toDate: Dashboardtoday,
        customeDate: false,
      },
    },
  },
  loading: false,
  error: null,
};
const initalProfitAndLossData = {
  ProfitAndLossData: initialState.dashboard.ProfitAndLossData,
  ProfitAndLossTotals: initialState.dashboard.ProfitAndLossTotals,
};
const initalSalesData = {
  SalesData: initialState.dashboard.SalesData,
  TotalSales: initialState.dashboard.TotalSales,
};
const initalAccountsReceivableData = {
  AccountsReceivable: initialState.dashboard.AccountsReceivable,
};
const initalAccountsPayableData = {
  AccountsPayable: initialState.dashboard.AccountsPayable,
};
const initalExpenseData = {
  expenseData: initialState.dashboard.expenseData,
  expenseTotal: initialState.dashboard.expenseTotal,
};
const initalInvoicesAndBillsSummaryData = {
  InvoicesAndBillsSummary: initialState.dashboard.InvoicesAndBillsSummary,
};


export const fetchAllProfitAndLossStats = createAsyncThunk(
  "dashboard/fetchAllProfitAndLossStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getProfitAndLossDashboard({
        fromDate,
        toDate,
      });
      return response.data || initalProfitAndLossData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);
export const fetchAllSalesStats = createAsyncThunk(
  "dashboard/fetchAllSalesStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getSalesDashboard({
        fromDate,
        toDate,
      });
      return response.data || initalSalesData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);
export const fetchAllAccountsReceivableStats = createAsyncThunk(
  "dashboard/fetchAllAccountsReceivableStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getAccountsReceivable({
        fromDate,
        toDate,
      });
      return response.data || initalAccountsReceivableData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);
export const fetchAllAccountsPayableStats = createAsyncThunk(
  "dashboard/fetchAllAccountsPayableStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getAccountsPayable({
        fromDate,
        toDate,
      });
      return response.data || initalAccountsPayableData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);
export const fetchAllExpenseStats = createAsyncThunk(
  "dashboard/fetchAllExpenseStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getExpense({
        fromDate,
        toDate,
      });
      return response.data || initalExpenseData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);
export const fetchAllInvoicesAndBillsSummaryStats = createAsyncThunk(
  "dashboard/fetchAllInvoicesAndBillsSummaryStats",
  async (
    _,
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.Dashboard.getInvoicesAndBillsSummary();
      console.log("response.data ", response.data);
      return response.data || initalInvoicesAndBillsSummaryData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);

export const fetchAllCashFlowStats = createAsyncThunk(
  "dashboard/fetchAllCashFlowStats",
  async (
    { fromDate, toDate }: { fromDate: Moment; toDate: Moment },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.Dashboard.getCashFlow({
        fromDate,
        toDate,
      });
      const defaultCashFlowData = {
        cashInflows: [],
        cashOutflows: [],
        transactionSummary: [],
        totals: {
          totalCredits: 0,
          totalDebits: 0,
          netCashFlow: 0,
          transactionCount: 0
        }
      };
      return response.data || defaultCashFlowData;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message);
    }
  },
);

// Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.dashboard = initialState.dashboard;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFromDateFilter: (
      state,
      action: PayloadAction<{
        customeDate: boolean;
        type: keyof DashboardState["dateFilters"];
        value: Moment | null;
      }>,
    ) => {
      const { type, value, customeDate } = action.payload;
      state.dashboard.dateFilters[type].fromDate = value;
      state.dashboard.dateFilters[type].customeDate = customeDate;
    },
    setToDateFilter: (
      state,
      action: PayloadAction<{
        customeDate: boolean;
        type: keyof DashboardState["dateFilters"];
        value: Moment | null;
      }>,
    ) => {
      const { type, value, customeDate } = action.payload;
      state.dashboard.dateFilters[type].toDate = value;
      state.dashboard.dateFilters[type].customeDate = customeDate;
    },
    setDashboardView: (
      state,
      action: PayloadAction<'normal' | 'loadBreakdown'>
    ) => {
      state.dashboard.dashboardView = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all profit and loss stats
    builder
      .addCase(fetchAllProfitAndLossStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllProfitAndLossStats.fulfilled,
        (
          state,
          action: PayloadAction<{
            ProfitAndLossData: DashboardState["ProfitAndLossData"];
            ProfitAndLossTotals: DashboardState["ProfitAndLossTotals"];
          }>,
        ) => {
          state.loading = false;
          state.dashboard.ProfitAndLossData = action.payload.ProfitAndLossData;
          state.dashboard.ProfitAndLossTotals =
            action.payload.ProfitAndLossTotals;
        },
      )
      .addCase(fetchAllProfitAndLossStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all sales stats
    builder
      .addCase(fetchAllSalesStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllSalesStats.fulfilled,
        (
          state,
          action: PayloadAction<{
            SalesData: DashboardState["SalesData"];
            TotalSales: DashboardState["TotalSales"];
          }>,
        ) => {
          state.loading = false;
          state.dashboard.SalesData = action.payload.SalesData;
          state.dashboard.TotalSales = action.payload.TotalSales;
        },
      )
      .addCase(fetchAllSalesStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all accounts receivable stats
    builder
      .addCase(fetchAllAccountsReceivableStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllAccountsReceivableStats.fulfilled,
        (
          state,
          action: PayloadAction<{
            AccountsReceivable: DashboardState["AccountsReceivable"];
          }>,
        ) => {
          state.loading = false;
          state.dashboard.AccountsReceivable =
            action.payload.AccountsReceivable;
        },
      )
      .addCase(fetchAllAccountsReceivableStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all accounts payable stats
    builder
      .addCase(fetchAllAccountsPayableStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllAccountsPayableStats.fulfilled,
        (
          state,
          action: PayloadAction<{
            AccountsPayable: DashboardState["AccountsPayable"];
          }>,
        ) => {
          state.loading = false;
          state.dashboard.AccountsPayable = action.payload.AccountsPayable;
        },
      )
      .addCase(fetchAllAccountsPayableStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all expense stats
    builder
      .addCase(fetchAllExpenseStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllExpenseStats.fulfilled,
        (
          state,
          action: PayloadAction<{
            expenseData: DashboardState["expenseData"];
            expenseTotal: DashboardState["expenseTotal"];
          }>,
        ) => {
          state.loading = false;
          state.dashboard.expenseData = action.payload.expenseData;
          state.dashboard.expenseTotal = action.payload.expenseTotal;
        },
      )
      .addCase(fetchAllExpenseStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all invoices and bills summary stats
    builder
      .addCase(fetchAllInvoicesAndBillsSummaryStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllInvoicesAndBillsSummaryStats.fulfilled,
        (
          state,
          action: PayloadAction<DashboardState["InvoicesAndBillsSummary"]>,
        ) => {
          state.loading = false;
          state.dashboard.InvoicesAndBillsSummary = action.payload;
        },
      )
      .addCase(
        fetchAllInvoicesAndBillsSummaryStats.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      );



    // Fetch all cash flow stats
    builder
      .addCase(fetchAllCashFlowStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllCashFlowStats.fulfilled,
        (
          state,
          action: PayloadAction<CashFlowData>
        ) => {
          state.loading = false;
          state.dashboard.CashFlow = action.payload;
        },
      )
      .addCase(fetchAllCashFlowStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearDashboardData,
  clearError,
  setFromDateFilter,
  setToDateFilter,
  setDashboardView,
} = dashboardSlice.actions;
export { LastMonth };
export default dashboardSlice.reducer;
