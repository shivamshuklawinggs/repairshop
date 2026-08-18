import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SearchFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  billNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type SearchEntityType = 'all' | 'invoices' | 'bills' | 'payments' | 'customers' | 'carriers';

interface GlobalSearchState {
  isSearchOpen: boolean;
  isAdvancedSearchOpen: boolean;
  searchQuery: string;
  filters: SearchFilters;
  searchHistory: string[];
  isSearching: boolean;
  lastSearchResults: any;
  searchType: SearchEntityType;
}

const initialState: GlobalSearchState = {
  isSearchOpen: false,
  isAdvancedSearchOpen: false,
  searchQuery: '',
  filters: {},
  searchHistory: [],
  isSearching: false,
  lastSearchResults: null,
  searchType: 'all'
};

const globalSearchSlice = createSlice({
  name: 'globalSearch',
  initialState,
  reducers: {
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory = [query, ...state.searchHistory.slice(0, 9)]; // Keep last 10
      }
    },
    removeFromSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(item => item !== action.payload);
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setLastSearchResults: (state, action: PayloadAction<any>) => {
      state.lastSearchResults = action.payload;
    },
    setAdvancedSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isAdvancedSearchOpen = action.payload;
    },
    setSearchType: (state, action: PayloadAction<SearchEntityType>) => {
      state.searchType = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.filters = {};
      state.lastSearchResults = null;
    }
  },
});

export const {
  toggleSearch,
  setSearchOpen,
  setAdvancedSearchOpen,
  setSearchQuery,
  setFilters,
  clearFilters,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  setSearching,
  setLastSearchResults,
  setSearchType,
  clearSearch
} = globalSearchSlice.actions;

export default globalSearchSlice.reducer;
