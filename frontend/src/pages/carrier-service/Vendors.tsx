import React, { useState, useEffect, useCallback, useRef, RefObject, } from 'react';
import { Button, TableCell, TableRow, Paper, Typography, Box, CircularProgress, Menu, MenuItem, Checkbox, Tooltip, IconButton, Divider, Drawer } from '@mui/material';
import { DataTable } from '@/components/ui';
import { CustomerStatus, ICarrier, } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { Add as AddIcon, Settings as SettingsIcon, Print as PrintIcon, Download, FilterList as FilterListIcon, OpenInNew } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { downloadCSV, handlePrint } from '@/utils';
import { VendorsColumns } from '@/data/customer'
import { setVendorsVisibleColumns, toggleVendorsColumn, } from '@/redux/Slice/ColumnFilterSlice';
import renderCell from './VendorForm/components/renderCell';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/utils/paths';
import VerticalMenu from '@/components/VerticalMenu';
import useDebounce from '@/hooks/useDebounce';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasAccess, HasPermission, withPermission } from '@/hooks/authUtils';
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import CarrierFilters, { CarrierFiltersType }  from '@/components/CarrierFilters';
import CustomerDashboard from './CustomerDashboard';
import { getIcon } from '@/components/common/icons/getIcon';
import { PageHeader } from '@/components/ui';
import AppSearch from '@/components/common/AppSearch';
import { API_URL } from '@/config';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';
import ColumnSelector from '@/components/ui/ColumnSelector';

const DEFAULT_PAGE_SIZE = 10;

const View: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user);

  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<CarrierFiltersType>({
    search: '',
    status: '' as CustomerStatus,
    hasOpenBalance: false,
    ratingRange: [0, 5] as [number, number],
    carrierOperation:[],
    operatingStatus:[],
    hasDrivers: "" as unknown as boolean
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  const visibleColumns = useSelector(
    (state: RootState) => state.columnFilter.vendorsVisbleColmns
  );
  const [selectedCustomer, setSelectedCustomer] = useState<
    ICarrier | boolean
  >(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: vendorsData, isLoading, refetch } = useQuery({
    queryKey: ['vendors', currentPage, limit, debouncedSearch, filters],
    queryFn: async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: limit,
          search: debouncedSearch,
        };

        // Add carrier filters to params
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.hasOpenBalance) params.hasOpenBalance = filters.hasOpenBalance;
        if (filters.ratingRange[0] > 0) params.ratingMin = filters.ratingRange[0];
        if (filters.ratingRange[1] < 5) params.ratingMax = filters.ratingRange[1];

        const response = await apiService.getVendors(params);
        return response;
      } catch (err) {
        console.warn(err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const vendors = vendorsData?.data || [];
  const total = vendorsData?.pagination?.total || 0;

  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) => apiService.deleteVendor(vendorId),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });

  const exportVendorsMutation = useMutation({
    mutationFn: () => apiService.exportCarrier({ limit, page: currentPage, search: debouncedSearch }),
    onSuccess: (data) => {
      downloadCSV(data.data);
      toast.success('Vendors exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export vendors');
    },
  });
  const invoiceImportMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importVendors(formData);
    },
    onSuccess: (response: any) => {
      refetch();
      toast.success(response?.message || `vendors imported successfully`);
    },
    onError: (error: any) => {
      const allerrors = error?.response?.data?.errors?.allErrors
      if (!allerrors) {
        toast.error(error.message);
      }
    },
  });



  // Initialize visible columns once
  useEffect(() => {
    if (!visibleColumns || visibleColumns.length === 0) {
      const initial = VendorsColumns.slice(0, 6).map((c) => c.key);
      dispatch(setVendorsVisibleColumns(initial));
    }
  }, [dispatch, visibleColumns]);


 const handleFiltersChange = (key: keyof CarrierFiltersType, value: any) => {
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
      operatingStatus: [],
      hasDrivers: "" as unknown as boolean
    });
    setCurrentPage(1);
  };

  const handleColumnToggle = useCallback(
    (key: string) => {
      dispatch(toggleVendorsColumn(key));
    },
    [dispatch]
  );

  const handleColumnMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setColumnMenuAnchor(e.currentTarget);
  };
  const handleColumnMenuClose = () => setColumnMenuAnchor(null);

  const handleEditClick = (customer: ICarrier) => {
    setSelectedCustomer({ ...customer } as ICarrier);
  };

  const handleAddNew = () => {
    setSelectedCustomer(true)
  };

  const handleDeleteVendor = useCallback(
    (customerId: string) => {
      if (!window.confirm('Are you sure you want to delete this customer?')) return;
      deleteVendorMutation.mutate(customerId);
    },
    [deleteVendorMutation]
  );

  const handleExportData = useCallback(() => {
    exportVendorsMutation.mutate();
  }, [exportVendorsMutation]);


    const handleImportInvoice = (file: File) => {
    invoiceImportMutation.mutate({ file });
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
        <PageHeader
          title="Vendors"
          subtitle="Manage your vendor accounts"
          actions={
            <HasPermission action="create" resource={["accounting"]} component={
              <Button variant="contained" className='themBtn'
              size="small" startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{
                borderRadius: {xs:'6px', md:'6px'},
                boxShadow:'none',
                py:{xs:0, md:0.5},
                pr:{xs: 1.5, md:2.5},
                pl:{xs: 1, md:2},
                fontWeight:'500',
                minHeight:{xs:'28px', md:'35px'},
                fontSize:{xs:'13px', md:'14px'},
                '& .MuiButton-startIcon': {
                  marginRight: '3px',
                    },
                  '& .MuiButton-startIcon svg': {
                  fontSize: '15px'
                  }
                }}>
                Add
              </Button>
            } />
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
              mt:2.5,
              bgcolor:'transparent',
              border:'none',
            }}
            >
              {/* Search Filter */}
              <Box sx={{mb:{ xs: 1.5, md: 0 },}}>
                <AppSearch
                  value={filters.search}
                  onSearch={(val) => handleFiltersChange('search', val)}
                   sx={{
                    '& .MuiInputBase-root': {
                      height:'30px',
                    },
                  }}
                />
              </Box>

              <Box>
                <HasPermission
                action="import"
                resource={["accounting"]}
                component={
                  <FileUploadButton onFileSelect={handleImportInvoice} loading={invoiceImportMutation.isPending} />
                }
              />

              <Tooltip title="Filter">
                <IconButton size="small" onClick={() => setFilterDrawerOpen(true)} sx={{ color: '#5c626e', pl:1.2 }}>
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Toggle Columns">
                <IconButton size="small" onClick={handleColumnMenuOpen} sx={{ color: '#5c626e' }}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Print">
                <IconButton size="small" onClick={() => handlePrint(printRef as RefObject<HTMLDivElement>, 'Vendors')} sx={{ color: '#5c626e' }}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Export CSV">
                <span>
                  <IconButton size="small"
                  onClick={handleExportData} disabled={exportVendorsMutation.isPending} sx={{ color: '#5c626e', pr:0.5 }}>
                    {exportVendorsMutation.isPending ? <CircularProgress size={14} /> : <OpenInNew fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Download Sample">
                <IconButton
                  size="small"
                  href={`${API_URL}public/samples/vendors.csv`}
                  download
                  sx={{
                    color: '#5c626e',
                    '& svg': {
                      fontSize: '1.25rem',
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
                columns={VendorsColumns}
                visibleColumns={visibleColumns}
                defaultColumns={VendorsColumns.filter((i=>i.disabled)).map((c) => c.key)}
                onChange={(columns) =>
                  dispatch(setVendorsVisibleColumns(columns))
                }
              />

              </Box>
            </Paper>

        <FileImportError allerrors={invoiceImportMutation?.error?.response?.data?.errors?.allErrors || []} message={invoiceImportMutation?.error?.response?.data?.message || "Error importing vendors"} />

        <DataTable
          columns={VendorsColumns.filter(col => visibleColumns.includes(col.key)).concat([{ key: 'actions', label: 'Actions', align:'center' }])}
          data={vendors.filter((c: ICarrier) => c._id)}
          isLoading={isLoading}
          emptyMessage="No vendors found"
          total={total}
          page={currentPage - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onRowsPerPageChange={(rows) => { setLimit(rows); setCurrentPage(1); }}
          renderRow={(vendor: ICarrier) => (
            <TableRow key={vendor._id} sx={{ '&:last-child td': { border: 0 } }}>
              {VendorsColumns
                .filter((col) => col.key !== 'invoice' && visibleColumns.includes(col.key))
                .map((col) => (
                  <TableCell align={col.align}
                    key={col.key}
                    onClick={() => hasAccess(["accounting"], "view", currentUser) && navigate(paths.vendortransactionlist + '/' + vendor._id, { state: { page: currentPage, limit } })}
                    sx={{ cursor: 'pointer', whiteSpace: 'nowrap'}}
                  >
                    {renderCell({ column: col.key, vendor, navigate })}
                  </TableCell>
                ))}

              <TableCell align="center">
                <VerticalMenu
                  actions={[
                    hasAccess( ["accounting"] , "update", currentUser) ? { label: 'Edit', icon: "edit", onClick: () => handleEditClick(vendor) } : null,
                    hasAccess( ["accounting"] , "delete", currentUser) ? { label: 'Delete', icon: "delete", onClick: () => handleDeleteVendor(vendor._id || '') } : null,
                    hasAccess(["accounting"], "create", currentUser) ? { label: 'Make Payment', icon: "payment", onClick: () => navigate('/accounting/purchase/accounts/recievedbill/' + vendor._id) } : null,
                    hasAccess(['accounting'], "create", currentUser) ? { label: 'Report', icon: "reports", onClick: () => navigate(`${paths.carriers}/report/${vendor._id}`) } : null,
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
          <Box sx={{p:{xs:2, md:3} }}>
            <CarrierFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              showOprations={false}
            />
          </Box>
        </Drawer>
        <UniversalEntityForm
          open={Boolean(selectedCustomer)}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setSelectedCustomer(false);
          }}
          id={typeof  selectedCustomer==="object"?selectedCustomer._id as string:""}
          entityType="vendor"
        />
    </Box>
  );
};
export default withPermission("view",["accounting"])(View)

