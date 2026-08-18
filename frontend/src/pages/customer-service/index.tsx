import React, { useState, useEffect, useCallback, useRef, RefObject, } from 'react';
import { PageHeader, DataTable } from '@/components/ui';
import { Button, TableCell, TableRow, Paper, Typography, Box, Menu, MenuItem, Checkbox, Tooltip, IconButton, Divider, Drawer } from '@mui/material';
import { ICustomer, IAccountsCustomerView, IPaymentTerm, CustomerStatus, } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { Add as AddIcon, Settings as SettingsIcon, Print as PrintIcon, Download, FilterList as FilterListIcon, ImportExport, OpenInNew } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { downloadCSV, handlePrint, } from '@/utils';
import CustomerDashboard from './shared/CustomerDashboard';
import { AccountsCustomerColumns } from '@/data/customer'
import { setAccountsCustomerVisibleColumns, toggleAccountsCustomerColumn, } from '@/redux/Slice/ColumnFilterSlice';
import renderCell from './components/renderCell';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/utils/paths';
import VerticalMenu from '@/components/VerticalMenu';
import useDebounce from '@/hooks/useDebounce';
import { useMutation, useQuery } from '@tanstack/react-query';
import { hasAccess, HasPermission, withPermission } from '@/hooks/authUtils'
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import CustomerFilters, { CustomerFiltersType } from '@/components/CustomerFilters';
import { getIcon } from '@/components/common/icons/getIcon';
import AppSearch from '@/components/common/AppSearch';
import { API_URL } from '@/config';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';
import ColumnSelector from '@/components/ui/ColumnSelector';

const DEFAULT_PAGE_SIZE = 10;

const ViewCustomers: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const visibleColumns = useSelector(
    (state: RootState) => state.columnFilter.accountsCustomerVisbleColmns
  );

  // Filter state
  const [filters, setFilters] = useState<CustomerFiltersType>({
    search: '',
    status: '' as CustomerStatus,
    hasOpenBalance: false,
    ratingRange: [0, 5] as [number, number],
    operatingStatus: [],
    carrierOperation: [],

  });

  const debouncedSearch = useDebounce(filters.search, 400);
  const [selectedCustomer, setSelectedCustomer] = useState<
    ICustomer | boolean
  >(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch customers when deps change
  const { data: customer, isLoading: loading, refetch } = useQuery({
    queryKey: ['customers', currentPage, limit, debouncedSearch, filters],
    queryFn: async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: limit,
          search: debouncedSearch,
        };

        // Add customer filters to params
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.hasOpenBalance) params.hasOpenBalance = filters.hasOpenBalance;
        if (filters.ratingRange[0] > 0) params.ratingMin = filters.ratingRange[0];
        if (filters.ratingRange[1] < 5) params.ratingMax = filters.ratingRange[1];

        const response = await apiService.getAccountsCustomers(params);
        return response;
      } catch (err) {
        console.warn(err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
  const invoiceImportMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importCustomers(formData);
    },
    onSuccess: (response: any) => {
      refetch();
      toast.success(response?.message || `customers imported successfully`);
    },
    onError: (error: any) => {
      const allerrors = error?.response?.data?.errors?.allErrors
      if (!allerrors) {
        toast.error(error.message);
      }
    },
  });

  const handleFiltersChange = (key: keyof CustomerFiltersType, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '' as CustomerStatus,
      hasOpenBalance: false,
      ratingRange: [0, 5] as [number, number],
      carrierOperation: [],
      operatingStatus: []
    });
    setCurrentPage(1);
  };

  const handleColumnToggle = useCallback(
    (key: string) => {
      dispatch(toggleAccountsCustomerColumn(key));
    },
    [dispatch]
  );

  const handleColumnMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setColumnMenuAnchor(e.currentTarget);
  };
  const handleColumnMenuClose = () => setColumnMenuAnchor(null);

  const handleEditClick = (customer: IAccountsCustomerView) => {
    setSelectedCustomer({ ...customer } as ICustomer);
  };

  const handleAddNew = () => setSelectedCustomer(true);

  const handleDeleteCustomer = useCallback(
    async (customerId: string) => {
      try {
        if (!window.confirm('Are you sure you want to delete this customer?'))
          return;
        await apiService.deleteAccountsCustomer(customerId);
        toast.success('Customer deleted successfully');
        refetch()
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete customer');
      }
    },
    [dispatch, currentPage, limit]
  );
  const handleImportInvoice = (file: File) => {
    invoiceImportMutation.mutate({ file });
  };

  const handleExportData = useCallback(async () => {
    try {
      const resp = await apiService.exportCustomers(
        {
          limit,
          page: currentPage,
          search: filters.search,
        },
        'accounts'
      );
      await downloadCSV(resp.data);
    } catch (e: any) {
      toast.error('Export failed');
    }
  }, [currentPage, limit, filters.search]);


  const customers = customer?.data || [];
  const total = customer?.pagination?.total || 0;
  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header + Actions */}
      <PageHeader
        title="Customer Management"
        subtitle="Manage your customer accounts"
        actions={
          <HasPermission
            action="create"
            resource={["accounting"]}
            component={
              <Button
                className='themBtn'
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{
                  borderRadius: { xs: '6px', md: '6px' },
                  boxShadow: 'none',
                  py: { xs: 0, md: 0.5 },
                  pr: {xs: 1.5, md:2.5},
                  pl: {xs: 1, md:2},
                  fontWeight: '500',
                  minHeight: { xs: '28px', md: '35px' },
                  fontSize: { xs: '13px', md: '14px' },
                  '& .MuiButton-startIcon': {
                    marginRight: '3px',
                  },
                  '& .MuiButton-startIcon svg': {
                    fontSize: '15px'
                  }
                }}>
                Add
              </Button>
            }
          />
        }
      />

      <CustomerDashboard />

      {/* Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          display: { xs: 'block', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          p: 0,
          mb: 0,
          mt: 2.5,
          bgcolor: 'transparent',
          border: 'none',
        }}
      >
        {/* Search Filter */}
        <Box sx={{ mb: { xs: 1.5, md: 0 } }}>
          <AppSearch
            value={filters.search}
            onSearch={(val) => handleFiltersChange('search', val)}
            sx={{
              '& .MuiInputBase-root': {
                height: '30px',
              },
            }}
          />
        </Box>

        <Box>
          <HasPermission
            action="import"
            resource={['accounting']}
            component={
              <FileUploadButton
                onFileSelect={handleImportInvoice}
                loading={invoiceImportMutation.isPending}
              />
            }
          />
          <Tooltip title="Filter">
            <IconButton size="small" onClick={() => setFilterDrawerOpen(true)} sx={{ color: '#5c626e', pl: 2 }}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Columns">
            <IconButton size="small" onClick={handleColumnMenuOpen} sx={{ color: '#5c626e' }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Print">
            <IconButton
              size="small"
              onClick={() => handlePrint(printRef as RefObject<HTMLDivElement>, 'Customers')}
              sx={{ color: '#5c626e' }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export CSV">
            <IconButton size="small" onClick={handleExportData} sx={{ color: '#5c626e', pr: 0.5 }}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download Sample CSV">
            <IconButton
              size="small"
              href={`${API_URL}public/samples/customers.csv`}
              download
              sx={{
                color: '#5c626e',
                '& svg': {
                  fontSize: 21
                }
              }}
            >
              {getIcon('fileExport')}
            </IconButton>
          </Tooltip>

          <ColumnSelector
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={handleColumnMenuClose}
            title="Visible Columns"
            columns={AccountsCustomerColumns}
            visibleColumns={visibleColumns}
            defaultColumns={AccountsCustomerColumns.filter((i=>i.disabled)).map((c) => c.key)}
            onChange={(columns) =>
              dispatch(setAccountsCustomerVisibleColumns(columns))
            }
          />

        </Box>
      </Paper>

      <FileImportError allerrors={invoiceImportMutation?.error?.response?.data?.errors?.allErrors || []} message={invoiceImportMutation?.error?.response?.data?.message || "Error importing vendors"} />

      <DataTable
        columns={AccountsCustomerColumns.filter(col => visibleColumns.includes(col.key)).concat([{ key: 'actions', label: 'Actions', align: 'center' }])}
        data={customers.filter((c: Omit<IAccountsCustomerView, 'paymentTerms'> & { paymentTerms: IPaymentTerm }) => c._id)}
        isLoading={loading}
        emptyMessage="No customers found"
        total={total}
        page={currentPage - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(newPage) => setCurrentPage(newPage + 1)}
        onRowsPerPageChange={(rows) => { setLimit(rows); setCurrentPage(1); }}
        renderRow={(customer: Omit<IAccountsCustomerView, 'paymentTerms'> & { paymentTerms: IPaymentTerm }) => (
          <TableRow key={customer._id} sx={{ '&:last-child td':{border:0} }}>
            {AccountsCustomerColumns
              .filter((col) => col.key !== 'invoice' && visibleColumns.includes(col.key))
              .map((col) => (
                <TableCell align={col.align}
                  key={col.key}
                  onClick={() => hasAccess(["accounting"], "view", user) && col.key !== 'rating' && navigate(paths.customertransactionlist + '/' + customer._id, { state: { page: currentPage, limit } })}
                  sx={{ cursor: col.key !== 'rating' ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                >
                  {renderCell({ column: col.key, customer, navigate })}
                </TableCell>
              ))}
            <TableCell align="center">
              <VerticalMenu
                actions={[
                  hasAccess( ["accounting"] , "update", user) ? { label: 'Edit', icon: "edit", onClick: () => handleEditClick(customer as any) } : null,
                  hasAccess(["accounting"], "delete", user) ? { label: 'Delete', icon: "delete", onClick: () => handleDeleteCustomer(customer._id || '') } : null,
                  hasAccess(["accounting"], "create", user) ? { label: 'Make Payment', icon: "payment", onClick: () => navigate(`/accounting/sales/accounts/recievedpayment/${customer._id}`) } : null,
                  hasAccess(['accounting'], "create", user) ? { label: 'Report', icon: "reports", onClick: () => navigate(`${paths.customers}/report/${customer._id}`) } : null,
                ]}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{ sx: { width: 320 } }}
      >
        <Box sx={{p:{xs:2,md:3}}}>
          <CustomerFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            showOprations={false}
          />
        </Box>
      </Drawer>

      {/* Add / Edit modal */}
      <UniversalEntityForm
        open={Boolean(selectedCustomer)}
        id={typeof selectedCustomer === "object" ? (selectedCustomer?._id || "") : ''}
        entityType= "account-customer"
        onClose={() => {
          refetch()
          setSelectedCustomer(false);
        }} />
    </Box>
  );
};

export default withPermission("view", ["accounting"])(ViewCustomers);
