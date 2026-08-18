import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchSuperadminStats, fetchBusinessAnalytics } from '../api';
import { SystemStats } from '@/types';

interface BusinessAnalytics {
  usersByCountry: Array<{
    _id: string;
    totalUsers: number;
    totalAdmins: number;
  }>;
  totalCountries: number;
  adminPerformance: Array<{
    adminId: string;
    adminName: string;
    adminEmail: string;
    country: string;
    currentRevenue: number;
    previousRevenue: number;
    totalRevenue90Days: number;
    currentProfit: number;
    previousProfit: number;
    growthRate: number;
    performanceStatus: 'growth' | 'stable' | 'loss';
  }>;
  performanceSummary: {
    growth: number;
    stable: number;
    loss: number;
    totalRevenue: number;
  };
  userGrowthTrend: Array<{
    month: string;
    count: number;
  }>;
  invoiceActivityTrend: Array<{
    month: string;
    year: number;
    monthNumber: number;
    invoiceCount: number;
    revenue: number;
  }>;
  billActivityTrend: Array<{
    month: string;
    year: number;
    monthNumber: number;
    billCount: number;
    expenses: number;
  }>;
  customerAcquisitionTrend: Array<{
    month: string;
    year: number;
    monthNumber: number;
    customerCount: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    userRegistrations: number;
    invoices: number;
    bills: number;
    customers: number;
    revenue: number;
    expenses: number;
  }>;
  peakActivity: {
    userRegistration: {
      month: string;
      count: number;
    } | null;
    invoiceCreation: {
      month: string;
      count: number;
      revenue: number;
    } | null;
    billCreation: {
      month: string;
      count: number;
      expenses: number;
    } | null;
    customerAcquisition: {
      month: string;
      count: number;
    } | null;
  };
  topAdmins: Array<{
    adminId: string;
    adminName: string;
    adminEmail: string;
    country: string;
    revenue: number;
    growthRate: number;
    status: string;
  }>;
  timestamp: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuperadminState {
  stats: SystemStats | null;
  analytics: BusinessAnalytics | null;
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: SuperadminState = {
  stats: null,
  analytics: null,
  pagination: null,
  loading: false,
  error: null,
};

const superadminSlice = createSlice({
  name: 'superadmin',
  initialState,
  reducers: {
    setStats: (state, action: PayloadAction<SystemStats>) => {
      state.stats = action.payload;
    },
    setAnalytics: (state, action: PayloadAction<BusinessAnalytics>) => {
      state.analytics = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperadminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuperadminStats.fulfilled, (state, action: PayloadAction<SystemStats>) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchSuperadminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to load statistics';
        state.stats = null;
      })
      .addCase(fetchBusinessAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusinessAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchBusinessAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to load analytics';
        state.analytics = null;
      });
  },
});

export const {
  setStats,
  setAnalytics,
  setLoading,
  setError,
} = superadminSlice.actions;

export default superadminSlice.reducer;
