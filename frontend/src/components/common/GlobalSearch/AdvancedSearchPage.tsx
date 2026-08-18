import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Tab,
  Tabs,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Paper,
  CircularProgress,
  InputAdornment,
  Badge,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '@/redux/store';
import {
  setFilters,
  clearFilters,
  setSearchQuery,
  addToSearchHistory,
  SearchFilters,
  SearchEntityType,
} from '@/redux/Slice/globalSearchSlice';
import apiService from '@/service/apiService';
import { withPermission } from '@/hooks/authUtils';
import { Role } from '@/types';
import { formatCurrency } from '@/utils';
import UnifiedTable from './UnifiedTable';
import { AdvanceSearchType } from '@/types/AdvanceSearch.types';
import AppSearch from '../AppSearch';
import CustomDatePicker from '../CommonDatePicker';
import StyledSummaryBar from '../StyledSummaryBar';
const ENTITY_TABS: { label: string; key: SearchEntityType; color: string }[] = [
  { label: 'All', key: 'all', color: '#6366f1' },
  { label: 'Invoices', key: 'invoices', color: '#10b981' },
  { label: 'Bills', key: 'bills', color: '#f59e0b' },
  { label: 'Payments', key: 'payments', color: '#3b82f6' },
  { label: 'Customers', key: 'customers', color: '#8b5cf6' },
  { label: 'Carriers', key: 'carriers', color: '#010202' },
];
const SummaryCard = ({ label, count, amount, color }: { label: string; count: number; amount?: number; color: string }) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: 'grey.200',
      borderLeft: `4px solid ${color}`,
      minWidth: 130,
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="h6" fontWeight={700}>{count.toLocaleString()}</Typography>
    {amount != null && (
      <Typography variant="caption" color="text.secondary">{formatCurrency(amount)}</Typography>
    )}
  </Box>
);
const AdvancedSearchPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchQuery } = useSelector((state: RootState) => state.globalSearch);
  const currentuser = useSelector((state: RootState) => state.user);
  const [activeTab, setActiveTab] = useState(0);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [localFilters, setLocalFilters] = useState<SearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({});
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100000]);
  const activeFiltersCount = Object.values(localFilters).filter(Boolean).length;

  // Pagination state for each entity type
  const [pagination, setPagination] = useState({
    invoices: { page: 1, limit: 5 },
    bills: { page: 1, limit: 5 },
    payments: { page: 1, limit: 5 },
    customers: { page: 1, limit: 5 },
    carriers: { page: 1, limit: 5 },
  });
  const handleDateChange = (field: keyof SearchFilters) => (e: any) => {
    const value = e.target.value || null;
    setLocalFilters((prev: SearchFilters) => ({ ...prev, [field]: value }));

  };

  const searchParams = {
    search: localQuery || undefined,
    ...appliedFilters,
    ...Object.keys(pagination).reduce((acc, key) => {
      const entityKey = key as keyof typeof pagination;
      acc[`${entityKey}Page`] = pagination[entityKey].page;
      acc[`${entityKey}Limit`] = pagination[entityKey].limit;
      return acc;
    }, {} as Record<string, any>),
  };

  const { data, isLoading, refetch } = useQuery<{ data: AdvanceSearchType }>({
    queryKey: ['advancedSearch', localQuery, appliedFilters, pagination],
    queryFn: () => apiService.getUnifiedFinancialData(searchParams),
    enabled: Boolean(currentuser.user?.role !== Role.SUPERADMIN && currentuser.currentCompany),
  });

  const rd = data?.data

  // Pagination handlers
  const handlePageChange = (entityType: keyof typeof pagination, page: number) => {
    setPagination(prev => ({
      ...prev,
      [entityType]: { ...prev[entityType], page }
    }));
  };

  const handleRowsPerPageChange = (entityType: keyof typeof pagination, rowsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      [entityType]: { page: 1, limit: rowsPerPage }
    }));
  };

  const handleApply = () => {
    const filters: SearchFilters = {
      ...localFilters,
      minAmount: amountRange[0] > 0 ? amountRange[0] : undefined,
      maxAmount: amountRange[1] < 100000 ? amountRange[1] : undefined,
    };
    setAppliedFilters(filters);
    dispatch(setFilters(filters));
    if (localQuery) {
      dispatch(setSearchQuery(localQuery));
      dispatch(addToSearchHistory(localQuery));
    }
    refetch();
  };

  const handleReset = () => {
    setLocalFilters({});
    setAmountRange([0, 100000]);
    setAppliedFilters({});
    setPagination({
      invoices: { page: 1, limit: 5 },
      bills: { page: 1, limit: 5 },
      payments: { page: 1, limit: 5 },
      customers: { page: 1, limit: 5 },
      carriers: { page: 1, limit: 5 },
    });
    dispatch(clearFilters());
  };
  const getTabContent = () => {
    const tabKey = ENTITY_TABS[activeTab].key;
    if (!rd) return null;

    if (tabKey === 'all') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rd.invoices?.data?.length > 0 && (
            <Box sx={{ background: '#fff', px: 1.5, pt: 1, pb: 1.5, borderRadius: 0.5, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Invoices ({rd.invoices.count})
              </Typography>
              <Box
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: "13px",
                    //py: 0.5,
                  },
                  "& .MuiTableCell-root p": {
                    fontSize: "13px",
                  },
                  "& .MuiToolbar-root": {
                    minHeight: "25px !important",
                    height: 25,
                    overflow: 'hidden',
                    px: 0,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: 12,
                    margin: 0,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                <UnifiedTable
                  entityType="invoices"
                  data={rd.invoices.data}
                  currentPage={rd.invoices.pagination?.currentPage || 1}
                  totalPages={rd.invoices.pagination?.totalPages || 1}
                  totalCount={rd.invoices.count}
                  onPageChange={(page) => handlePageChange('invoices', page)}
                  onRowsPerPageChange={(limit) => handleRowsPerPageChange('invoices', limit)}
                  rowsPerPage={pagination.invoices.limit}
                />
              </Box>
            </Box>
          )}
          {rd.bills?.data?.length > 0 && (
            <Box sx={{ background: '#fff', px: 1.5, pt: 1, pb: 1.5, borderRadius: 0.5, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Bills ({rd.bills.count})
              </Typography>
              <Box
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: "13px",
                    //py: 0.5,
                  },
                  "& .MuiTableCell-root p": {
                    fontSize: "13px",
                  },
                  "& .MuiToolbar-root": {
                    minHeight: "25px !important",
                    height: 25,
                    overflow: 'hidden',
                    px: 0,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: 12,
                    margin: 0,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                <UnifiedTable
                  entityType="bills"
                  data={rd.bills.data}
                  currentPage={rd.bills.pagination?.currentPage || 1}
                  totalPages={rd.bills.pagination?.totalPages || 1}
                  totalCount={rd.bills.count}
                  onPageChange={(page) => handlePageChange('bills', page)}
                  onRowsPerPageChange={(limit) => handleRowsPerPageChange('bills', limit)}
                  rowsPerPage={pagination.bills.limit}
                />
              </Box>
            </Box>
          )}
          {rd.payments?.data?.length > 0 && (
            <Box sx={{ background: '#fff', px: 1.5, pt: 1, pb: 1.5, borderRadius: 0.5, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Payments ({rd.payments.count})
              </Typography>
              <Box
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: "13px",
                    //py: 0.5,
                  },
                  "& .MuiTableCell-root p": {
                    fontSize: "13px",
                  },
                  "& .MuiToolbar-root": {
                    minHeight: "25px !important",
                    height: 25,
                    overflow: 'hidden',
                    px: 0,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: 12,
                    margin: 0,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                <UnifiedTable
                  entityType="payments"
                  data={rd.payments.data}
                  currentPage={rd.payments.pagination?.currentPage || 1}
                  totalPages={rd.payments.pagination?.totalPages || 1}
                  totalCount={rd.payments.count}
                  onPageChange={(page) => handlePageChange('payments', page)}
                  onRowsPerPageChange={(limit) => handleRowsPerPageChange('payments', limit)}
                  rowsPerPage={pagination.payments.limit}
                />
              </Box>
            </Box>
          )}
          {rd.customers?.data?.length > 0 && (
            <Box sx={{ background: '#fff', px: 1.5, pt: 1, pb: 1.5, borderRadius: 0.5, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Customers ({rd.customers.count})
              </Typography>
              <Box
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: "13px",
                    //py: 0.5,
                  },
                  "& .MuiTableCell-root p": {
                    fontSize: "13px",
                  },
                  "& .MuiToolbar-root": {
                    minHeight: "25px !important",
                    height: 25,
                    overflow: 'hidden',
                    px: 0,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: 12,
                    margin: 0,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                <UnifiedTable
                  entityType="customers"
                  data={rd.customers.data}
                  currentPage={rd.customers.pagination?.currentPage || 1}
                  totalPages={rd.customers.pagination?.totalPages || 1}
                  totalCount={rd.customers.count}
                  onPageChange={(page) => handlePageChange('customers', page)}
                  onRowsPerPageChange={(limit) => handleRowsPerPageChange('customers', limit)}
                  rowsPerPage={pagination.customers.limit}
                />
              </Box>
            </Box>
          )}
         
          {rd.carriers?.data?.length > 0 && (
            <Box sx={{ background: '#fff', px: 1.5, pt: 1, pb: 1.5, borderRadius: 0.5, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Carriers ({rd.carriers.count})
              </Typography>
              <Box
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: "13px",
                    //py: 0.5,
                  },
                  "& .MuiTableCell-root p": {
                    fontSize: "13px",
                  },
                  "& .MuiToolbar-root": {
                    minHeight: "25px !important",
                    height: 25,
                    overflow: 'hidden',
                    px: 0,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: 12,
                    margin: 0,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                <UnifiedTable
                  entityType="carriers"
                  data={rd.carriers.data}
                  currentPage={rd.carriers.pagination?.currentPage || 1}
                  totalPages={rd.carriers.pagination?.totalPages || 1}
                  totalCount={rd.carriers.count}
                  onPageChange={(page) => handlePageChange('carriers', page)}
                  onRowsPerPageChange={(limit) => handleRowsPerPageChange('carriers', limit)}
                  rowsPerPage={pagination.carriers.limit}
                />
              </Box>
            </Box>
          )}
          {rd.summary?.totalRecords === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <SearchIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>No results found. Try adjusting your filters.</Typography>
            </Box>
          )}
        </Box>
      );
    }

    const entityType = tabKey as keyof typeof pagination;
    const entityData = rd[entityType];

    if (!entityData?.data?.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <SearchIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>No {tabKey} found. Try adjusting your filters.</Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          "& .MuiPaper-root": {
            mt: 0,
          },
          "& .MuiTableCell-root": {
            fontSize: "13px",
            py: 0.5,
          },
          "& .MuiTableCell-root p": {
            fontSize: "13px",
          },
          "& .MuiToolbar-root": {
            minHeight: "25px !important",
            height: 25,
            overflow: 'hidden',
            px: 0,
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 12,
            margin: 0,
          },
          "& .MuiSvgIcon-root": {
            fontSize: 18,
          },
        }}
      >
        <UnifiedTable
          entityType={entityType}
          data={entityData.data}
          currentPage={entityData.pagination?.currentPage || 1}
          totalPages={entityData.pagination?.totalPages || 1}
          totalCount={entityData.count}
          onPageChange={(page) => handlePageChange(entityType, page)}
          onRowsPerPageChange={(limit) => handleRowsPerPageChange(entityType, limit)}
          rowsPerPage={pagination[entityType].limit}
        />
      </Box>
    );
  };

  const getTabCount = (key: SearchEntityType): number => {
    if (!rd) return 0;
    if (key === 'all') return rd.summary?.totalRecords || 0;
    return rd[key]?.count || 0;
  };

  return (
    <>
      <Box
        sx={{
          display: { xs: 'block', md: 'flex' },
          //height: "calc(100vh - 80px)",
          height: { xs: 'auto', md: 'calc(100vh - 80px)' },
          overflow: "hidden",
          gap: 2,
        }}
       >
        {/* Filter Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 260 },
            flexShrink: 0,
            bgcolor: "background.paper",
            border: "1px solid #ddd",
            borderColor: "grey.200",
            p: 2.5,
            position: "sticky",
            top: 0,
            height: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Filters
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Typography>
            {activeFiltersCount > 0 && (
              <Tooltip title="Reset all filters">
                <IconButton size="small" onClick={handleReset} color='primary'>
                  <ResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <AppSearch
            placeholder="Search invoices, bills, loads, customers..."
            value={localQuery}
            onSearch={(val) => setLocalQuery(val)}
          />

          {/* Date Range */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>
              DATE RANGE
            </Typography>
            <Stack gap={1.5}>
              <CustomDatePicker
                fullWidth
                name="startDate"
                label="Start Date"
                value={localFilters.startDate}
                onChange={handleDateChange('startDate')}
                size="small"
                sx={{
                  '& .MuiInputLabel-shrink': {
                    display: 'none',
                  },
                  '& .MuiOutlinedInput-notchedOutline span': {
                    display: 'none',
                  },
                  '& .MuiInputLabel-root': {
                    lineHeight: '1em',
                    fontSize: '13px',
                  },
                  '& .MuiOutlinedInput-root': {
                    height: 30,
                  },
                  '& .MuiInputBase-input': {
                    padding: '4px 10px',
                    fontSize: '13px',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '0.95rem',
                    color: '#7c7c7c'
                  },
                }}
              />
              <CustomDatePicker
                fullWidth
                name="endDate"
                label="End Date"
                value={localFilters.endDate}
                minDate={localFilters?.startDate ? new Date(localFilters.startDate) : undefined}
                onChange={handleDateChange('endDate')}
                size="small"
                sx={{
                  '& .MuiInputLabel-shrink': {
                    display: 'none',
                  },
                  '& .MuiOutlinedInput-notchedOutline span': {
                    display: 'none',
                  },
                  '& .MuiInputLabel-root': {
                    lineHeight: '1em',
                    fontSize: '13px',
                  },
                  '& .MuiOutlinedInput-root': {
                    height: 30,
                  },
                  '& .MuiInputBase-input': {
                    padding: '4px 10px',
                    fontSize: '13px',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '0.95rem',
                    color: '#7c7c7c'
                  },
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Amount Range */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>
              AMOUNT RANGE
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={amountRange}
                onChange={(_, val) => setAmountRange(val as [number, number])}
                min={0}
                max={100000}
                step={500}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `$${v.toLocaleString()}`}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">${amountRange[0].toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">${amountRange[1].toLocaleString()}</Typography>
            </Box>
          </Box>
          <Divider />
          {/* Sort */}
          <Box>
            <Stack gap={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={localFilters.sortOrder || 'desc'}
                  label="Order"
                  onChange={(e) => setLocalFilters({ ...localFilters, sortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
          <Box>
            <Button variant="contained" fullWidth onClick={handleApply} sx={{ mb: 1 }}>
              Apply Filters
            </Button>
            <Button variant="outlined" fullWidth onClick={handleReset}>
              Reset All
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Summary Cards */}
          {/* {rd && (
                <StyledSummaryBar
                  sections={[
                    {
                      label: "Invoices",
                      count: rd.invoices?.count || 0,
                      totalAmount: rd.invoices?.totalAmount || 0,
                      percentage: rd.summary?.totalRecords ? ((rd.invoices?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#10b981"
                    },
                    {
                      label: "Bills",
                      count: rd.bills?.count || 0,
                      totalAmount: rd.bills?.totalAmount || 0,
                      percentage: rd.summary?.totalRecords ? ((rd.bills?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#f59e0b"
                    },
                    {
                      label: "Payments",
                      count: rd.payments?.count || 0,
                      totalAmount: rd.payments?.totalAmount || 0,
                      percentage: rd.summary?.totalRecords ? ((rd.payments?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#3b82f6"
                    },
                    {
                      label: "Customers",
                      count: rd.customers?.count || 0,
                      totalAmount: 0,
                      percentage: rd.summary?.totalRecords ? ((rd.customers?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#8b5cf6",
                      isCountNeeded:false
                    },
                    {
                      label: "Loads",
                      count: rd.loads?.count || 0,
                      totalAmount: 0,
                      percentage: rd.summary?.totalRecords ? ((rd.loads?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#ef4444",
                      isCountNeeded:false
                    },
                    {
                      label: "Carriers",
                      count: rd.carriers?.count || 0,
                      totalAmount: 0,
                      percentage: rd.summary?.totalRecords ? ((rd.carriers?.count || 0) / rd.summary.totalRecords) * 100 : 0,
                      color: "#14b8a6",
                      isCountNeeded:false
                    }
                ]}
              />
            )} */}
          {/* Tabs */}
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid #ddd', mt: { xs: 2, md: 0 } }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {ENTITY_TABS.map((tab, i) => (
                <Tab
                  key={tab.key}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {tab.label}
                      {rd && (
                        <Chip
                          label={getTabCount(tab.key)}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: activeTab === i ? tab.color : 'grey.200',
                            color: activeTab === i ? '#fff' : 'text.secondary',
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Results */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              mt: 2,
              pr: { xs: 0, md: 1 },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper elevation={0} sx={{ borderRadius: 0, background: 'transparent' }}>
                {getTabContent()}
              </Paper>
            )}
          </Box>
        </Box>

      </Box>
    </>
  );
};

export default withPermission("view", ["advancedSearch"])(AdvancedSearchPage);
