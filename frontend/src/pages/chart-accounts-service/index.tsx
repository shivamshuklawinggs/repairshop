import React, { useState } from 'react';
import { Box, Button, Dialog, TableRow, TableCell, DialogActions, IconButton, Tooltip } from '@mui/material';
import { PageHeader, DataTable } from '@/components/ui';
import { IChartAccount } from '@/types';
import ChartAccountForm from './ChartAccountForm';
import apiService from '@/service/apiService';
import { paths } from '@/utils/paths';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FilterBox from './FilterBox';
import useDebounce from '@/hooks/useDebounce';
import { hasAccess,withPermission } from '@/hooks/authUtils';
import VerticalMenu from '@/components/VerticalMenu';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import { toast } from 'react-toastify';
import { getIcon } from '@/components/common/icons/getIcon';
import {Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,} from '@mui/icons-material';
import chartOaccountdata from "@/data/chartofacount.json";
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import AppDialog from '@/components/ui/AppDialog';
import { API_URL } from '@/config';
import { downloadExcel, formatDebitCredit } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
export type ChartAccountFilterType="balance_sheet" | "profit_and_loss" | "all" | "createdBy"
const ChartAccountsPage: React.FC = () => {
  const navigate = useNavigate()
  const currentUser  = useSelector((state: RootState) => state.user);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IChartAccount | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ChartAccountFilterType>("all");
  const queryClient = useQueryClient();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch chart accounts using React Query
  const { data: chartAccountsData, isLoading, error,refetch } = useQuery({
    queryKey: ['chartAccounts', debouncedSearchQuery, filterType,page,rowsPerPage],
    queryFn: async () => {
      const balancesheets=["asset","liability","equity"].join(",") // balance sheet accounts
      const incomeexpense=["income","expense"].join(","); // income and expense accounts
      const type=filterType=="all"?undefined:filterType==="balance_sheet"?balancesheets: filterType==="createdBy"?filterType: incomeexpense
      const res = await apiService.getChartAccounts({
        isChartData:"1",nor:"",isProductServicesPage:"0",
        search: debouncedSearchQuery, type: type,limit:rowsPerPage,page:page });
      return res.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const importMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importChartAccounts(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chartAccounts'] });
      toast.success('Chart of accounts imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import chart of accounts');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => apiService.exportChartOfAccounts(),
    onSuccess: (data) => {
      downloadExcel(data.data);
      toast.success('Chart of accounts exported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to export chart of accounts');
    },
  });

  const handleImport = (file: File) => {
    importMutation.mutate({ file });
  };

  const deleteMutation = useMutation({
    mutationFn: (InvoicesId: string) => apiService.deleteChartAccount(InvoicesId),
    onSuccess: () => {
      toast.success('Chart Of Account deleted successfully');
      refetch();
    },
    onError: (error: any) => {

      toast.error( error.message || 'Failed to delete Chart Account');
    },
  });
  const handleDeleteInvoice= async (InvoiceId: string): Promise<void> => {
    const confirmDelete = window.confirm("Are you sure you want to delete this Chart Of Account?");
    if (confirmDelete) {
      deleteMutation.mutate(InvoiceId);
    }
  };
  // slice data for current page

  const paginatedRows = chartAccountsData?.data || []
  // const paginatedRows = chartOaccountdata?.data || []

  const handleFormSuccess = () => {
    setOpen(false);
    // Invalidate the query to refresh the data
    queryClient.invalidateQueries({ queryKey: ['chartAccounts'] });
  };
  return (
    <Box>
      <PageHeader
        title="Charts of Accounts"
        subtitle="Manage your chart of accounts"
        actions={
          <Box display="flex" alignItems="center" gap={0.5}>
            <FileUploadButton onFileSelect={handleImport} loading={importMutation.isPending} />
            <Tooltip title="Export Chart of Accounts">
              <span>
                <IconButton
                  size="small"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                  sx={{
                    pr: 0,
                    color: '#5c626e',
                    '& svg': {
                      fontSize: 20,
                    }
                  }}
                >
                  {exportMutation.isPending ? <LoadingSpinner size={16} /> : getIcon("OpenInNew")}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Sample CSV">
              <IconButton
                size="small"
                href={`${API_URL}public/samples/chart-of-accounts.csv`}
                download
                sx={{ color: '#5c626e', '& svg': { fontSize: 21 } }}
              >
                {getIcon('fileDownload')}
              </IconButton>
            </Tooltip>
            <Button className='themBtn' variant="contained"
            size="small" startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setOpen(true); }}
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
          </Box>
        }
      />

      <Box sx={{mt:3}}>
      <FilterBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        setPage={setPage}
      />
      </Box>

      <FileImportError
        allerrors={importMutation?.error?.response?.data?.errors?.allErrors || []}
        message={importMutation?.error?.response?.data?.message || 'Error importing chart of accounts'}
      />
   <ErrorHandlerAlert error={error}/>
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'accountType', label: 'Account Type' },
          { key: 'detailType', label: 'Detail Type' },
          { key: 'endingBalance', label: 'Ending Balance' },
          { key: 'actions', label: 'Actions', align: 'center' },
        ]}
        data={paginatedRows as any}
        isLoading={isLoading}
        emptyMessage="No accounts yet"
        total={chartAccountsData?.total ?? 0}
        page={page - 1}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(1); }}
        renderRow={(row: IChartAccount) => (
          <TableRow key={row._id} hover>
            <TableCell sx={{cursor:'pointer', whiteSpace:'nowrap', width:'15%'}} onClick={() => hasAccess(["accounting"],"view",currentUser) && navigate(paths.AccountRegister +"/"+ row._id)}>{row.id}</TableCell>
            <TableCell sx={{cursor:'pointer', whiteSpace:'nowrap', width:'20%'}} onClick={() => hasAccess(["accounting"],"view",currentUser) && navigate(paths.AccountRegister +"/"+ row._id)}>{row.name}</TableCell>
            <TableCell sx={{cursor:'pointer', whiteSpace:'nowrap', width:'20%'}} onClick={() => hasAccess(["accounting"],"view",currentUser) && navigate(paths.AccountRegister +"/"+ row._id)}>{row?.accountTypeData?.name || row?.accountType}</TableCell>
            <TableCell className='tellipsis' title={row?.detailTypeData?.name || row?.detailType} sx={{cursor:'pointer', width:'20%'}} onClick={() => hasAccess(["accounting"],"view",currentUser) && navigate(paths.AccountRegister +"/"+ row._id)}>{row?.detailTypeData?.name || row?.detailType}</TableCell>
            <TableCell sx={{cursor:'pointer', whiteSpace:'nowrap', width:'15%'}} onClick={() => hasAccess(["accounting"],"view",currentUser) && navigate(paths.AccountRegister +"/"+ row._id)}>{formatDebitCredit(row?.endingBalanceNumeric || 0)}</TableCell>
            <TableCell align="center" sx={{width:'10%'}}>
              <VerticalMenu actions={[
                hasAccess(["accounting"],"update",currentUser) ? { onClick: () => { setEditing(row); setOpen(true); }, label: "Edit", icon: "edit" } : null,
                hasAccess(["accounting"],"view",currentUser) ? { onClick: () => navigate(paths.AccountRegister+"/" + row._id), label: "View Register", icon: "RemoveRedEye" } : null,
                hasAccess(["accounting"],"delete",currentUser) ? { onClick: () => handleDeleteInvoice(row._id as string), label: "Delete", icon: "delete" } : null,
              ]}/>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Dialog */}
      <AppDialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogActions className='dialog-close'>
          <Button onClick={() => setOpen(false)}>
            {getIcon('CloseIcon')}
          </Button>
        </DialogActions>
        <ChartAccountForm
          initial={editing ?? undefined}
          onSuccess={handleFormSuccess}
        />
      </AppDialog>
    </Box>
  );
};

export default withPermission("view",["accounting"])(ChartAccountsPage);