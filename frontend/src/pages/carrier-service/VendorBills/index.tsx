import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable } from '@/components/ui';
import apiService from "@/service/apiService";
import { toast } from "react-toastify";
import moment from 'moment';
import { Modal, Box, Typography, Button, TableRow, TableCell, Stack, Chip, Tooltip, IconButton, DialogActions } from '@mui/material';
import {  Download } from '@mui/icons-material';
import CustomerInvoiseForm from './CustomerInvoiseForm';
import { IVendorBill, PaymentStatus, TransactionType, VendorInvoiceResponse } from '@/types';
import { RootState } from '@/redux/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSelector } from 'react-redux';
import { initialInvoiseData } from './genearateInvoiceSchema';
import VerticalMenu from '@/components/VerticalMenu';
import { hasAccess, HasPermission, withPermission } from '@/hooks/authUtils';
import FileUploadButton from '@/components/common/FileUploadButton';
import { Alert, AlertTitle, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { downloadCSV, getEmailStatus, getInvoiceStatus } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { getIcon } from '@/components/common/icons/getIcon';
import { API_URL } from '@/config';
import { useTransactionMenuActions } from '@/shared/useTransactionMenuActions';
import VerticalMenuInvoice from '@/components/VerticalMenuInvoice';
import TransactionFilters, { TransactionFiltersType } from '@/components/common/TransactionFilters';
import AppModalDialog from '@/components/ui/AppModalDialog';
interface LoadResponse {
  data: VendorInvoiceResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface MutationResponse {
  message: string;
  data: any;
}

interface InvoiceData {
  _id?: string;
  [key: string]: any;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {xs:'95%', md:'80%'},
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: {xs:2, md:2.5},
  pr: {xs:2, md:3.5},
  pb: {xs:2, md:3.5},
  pl: {xs:2, md:3.5},
  overflow: 'auto',
  borderRadius:'16px',
};

const VendorBills: React.FC = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<VendorInvoiceResponse | typeof initialInvoiseData | null>(initialInvoiseData);
  const [openErrorAlert, setOpenErrorAlert] = useState(true);

  const currentUser = useSelector((state: RootState) => state.user)

  const [filters, setFilters] = useState<TransactionFiltersType>({
    search: '',
    paymentStatus: '' as PaymentStatus,
    fromDate: null,
    toDate: null,
    minAmount: '',
    maxAmount: '',
  });
  const fetchLoads = async (): Promise<LoadResponse> => {
    try {
      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.fromDate) params.fromDate = filters.fromDate.format('YYYY-MM-DD');
      if (filters.toDate) params.toDate = filters.toDate.format('YYYY-MM-DD');
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response: LoadResponse = await apiService.getAccountBills(params);
      return response;
    } catch (error) {
      console.warn('Error fetching loads:', error);
      throw error;
    }
  };
  const { data, isPending, refetch } = useQuery<LoadResponse>({
    queryKey: ['other-invoices', currentPage, limit, filters],
    queryFn: fetchLoads,
  })

  const { mutate: createInvoiceMutation, isPending: isLoading } = useMutation<MutationResponse, Error, InvoiceData>({
    mutationFn: async (data) => {
      if (editingInvoice?._id) {
        return await apiService.updateAccountBill(editingInvoice._id, data);
      }
      return await apiService.generateAccountBill(data);
    },
    onSuccess: (response) => {
      refetch();
      toast.success(response?.message || `Invoice ${editingInvoice?._id ? 'updated' : 'created'} successfully`);
      setShowInvoiceModal(false);
      setEditingInvoice(initialInvoiseData);
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${editingInvoice?._id ? 'update' : 'create'} invoice`);
    }
  });
  const BillImportMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importBill(formData);
    },
    onSuccess: (response: any) => {
      refetch();
      toast.success(response?.message || `Bill imported successfully`);
    },
    onError: (error: any) => {
      const allerrors = error?.response?.data?.errors?.allErrors
      if (!allerrors) {
        toast.error(error.message);
      }
    },
  });
  const allerrors = BillImportMutation?.error?.response?.data?.errors?.allErrors
  const deleteMutation = useMutation({
    mutationFn: (loadId: string) => apiService.deleteAccountBill(loadId),
    onSuccess: () => {
      toast.success('Load deleted successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete load');
    },
  });
  const exportCustomersMutation = useMutation({
    mutationFn: () => apiService.exortBill(),
    onSuccess: (data) => {
      downloadCSV(data.data);
      toast.success('Invoices exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export Invoices');
    },
  });
  const handleExportData = async () => {
    exportCustomersMutation.mutate();
  }
  const handleDeleteLoad = async (loadId: string): Promise<void> => {
    const confirmDelete = window.confirm("Are you sure you want to delete this load?");
    if (confirmDelete) {
      deleteMutation.mutate(loadId);
    }
  }
  const handleInvoiceClick =async (invoice: VendorInvoiceResponse) => {
     try {
       if(invoice._id){
        const response = await apiService.getAccountBillById(invoice._id);
        if(response.data){
          setEditingInvoice(response.data);
          setShowInvoiceModal(true);
          return
        }
    }
     } catch (error:any) {
      toast.error(error?.message || "Faild To get Bill")
     }
  };


  const handleImportInvoice = (file: File) => {
    BillImportMutation.mutate({ file });
  };

  useEffect(() => {
    if (Array.isArray(allerrors) && allerrors.length > 0) {
      setOpenErrorAlert(true);
    }
  }, [allerrors]);

  return (
    <>
      <Box sx={{ minHeight: '100vh' }}>
          {Array.isArray(allerrors) && allerrors.length > 0 && (
            <Collapse in={openErrorAlert}>
              <Alert
                severity="error"
                action={
                  <IconButton aria-label="close" color="inherit" size="small" onClick={() => setOpenErrorAlert(false)}>
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2, borderRadius: 0.5 }}
              >
                <AlertTitle>{BillImportMutation?.error?.response?.data?.message}</AlertTitle>
                <Typography variant="body2">{allerrors.join(', ')}</Typography>
              </Alert>
            </Collapse>
          )}
          <PageHeader
            title="Vendor Bills"
            subtitle="Manage vendor bills and payments"
            actions={
              <>
                <HasPermission action="import" resource={["accounting"]} component={
                  <FileUploadButton onFileSelect={handleImportInvoice} loading={BillImportMutation.isPending} />
                } />
                <HasPermission action="export" resource={["accounting"]} component={
                  <Tooltip title="Export">
                    <span>
                      <IconButton size="small"
                      onClick={handleExportData} disabled={exportCustomersMutation.isPending}
                      sx={{
                        pr:0,
                        color: '#5c626e',
                        '& svg': {
                          fontSize: 20,
                        }
                      }}
                      >

                        {exportCustomersMutation.isPending ? <LoadingSpinner size={16} /> : getIcon("OpenInNew")}
                      </IconButton>
                    </span>
                  </Tooltip>
                } />

                <Tooltip title="Download Sample">
                  <IconButton size="small" href={`${API_URL}public/samples/bills.csv`}
                  download
                  sx={{ color: '#5c626e'}}>
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                <HasPermission action="create" resource={["accounting"]} component={
                  <Button className='themBtn'
                    variant="contained"
                    size="small"
                    startIcon={getIcon("plus")}
                    onClick={() => { setEditingInvoice(initialInvoiseData); setShowInvoiceModal(true); }}
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
              </>
            }
          />

          <TransactionFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1);
            }}
            onClearFilters={() => {
              setFilters({
                search: '',
                paymentStatus: '' as PaymentStatus,
                fromDate: null,
                toDate: null,
                minAmount: '',
                maxAmount: '',
              });
              setCurrentPage(1);
            }}
            showEmailStatus={false}
            searchPlaceholder="Search by bill number, vendor..."
            type="bill"
          />

          <DataTable
            columns={[
              { key: 'billNumber', label: 'Bill #' },
              { key: 'vendor', label: 'Vendor' },
              { key: 'billDate', label: 'Bill Date' },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'totalAmount', label: 'Total Amount' },
              { key: 'receivedAmount', label: 'Received Amount' },
              { key: 'balanceDue', label: 'Due Amount' },
              { key: 'status', label: 'Paymet Status', align: 'center' },
               {key: 'emailStatus', label: 'Status', align: 'center' },
              { key: 'actions', label: 'Actions', align: 'center' },
            ]}
            data={Array.isArray(data?.data) ? data.data : []}
            isLoading={isPending}
            total={data?.pagination?.total ?? 0}
            page={currentPage - 1}
            rowsPerPage={limit}
            onPageChange={(newPage) => setCurrentPage(newPage + 1)}
            onRowsPerPageChange={(rows) => setLimit(rows)}
            renderRow={(invoice) => (
              <TableRow key={invoice._id} sx={{ '&:last-child td': { border: 0 } }}>
                 <TableCell sx={{whiteSpace:'nowrap'}}>{invoice.BillNumber}</TableCell>
              <TableCell title={invoice.carrier?.company} className='tellipsis'>{invoice.carrier?.company || 'N/A'}</TableCell>
              <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>{invoice?.totalAmount?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{invoice?.receivedAmount?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{invoice?.balanceDue?.toFixed(2) || '0.00'}</TableCell>
              <TableCell align='center'>
                <Chip {...getInvoiceStatus(invoice.balanceDue || 0, invoice.dueDate,TransactionType.BILL ,invoice.paymentStatus)}
                variant='outlined'
                sx={{
                      fontWeight: 600,
                      py:0,
                      fontSize:'12px',
                      height:'auto',
                      px:0,
                      borderRadius:0.4,
                      '& .MuiChip-label':{
                        px:1,
                      }

                  }}
                />
              </TableCell>
              <TableCell align='center'>
                <Chip {...getEmailStatus(invoice.emailStatus)}
                variant='outlined'
                sx={{
                      fontWeight: 600,
                      py:0,
                      fontSize:'12px',
                      height:'auto',
                      px:0,
                      borderRadius:0.4,
                      '& .MuiChip-label':{
                        px:1,
                      }

                  }}
                />
              </TableCell>
                <TableCell align="center">
                  <Stack direction="row" justifyContent="center">
                    <VerticalMenuInvoice
                      actions={useTransactionMenuActions({
                        type: TransactionType.BILL,
                        item: invoice,
                        user: currentUser,
                        navigate,
                        showViewDetails: false,
                        showDownload: false,
                        showReminder: false,
                        onEdit: handleInvoiceClick,
                        onDelete: handleDeleteLoad,
                      })}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          />
      </Box>
      <AppModalDialog style={{backdropFilter:'blur(3px)'}}
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setEditingInvoice(initialInvoiseData);
        }}

        aria-labelledby="invoice-modal-title"
        aria-describedby="invoice-modal-description"
      >
        <Box sx={modalStyle}>
          <DialogActions className='dialog-close'>
          <Button onClick={() => setShowInvoiceModal(false)}>
            {getIcon('CloseIcon')}
           </Button>
          </DialogActions>

          <Typography id="invoice-modal-title" variant="h6" component="h2" sx={{mb:0}}>
            {editingInvoice?._id ? 'Edit Bill' : 'Create Bill'}
          </Typography>
          <CustomerInvoiseForm
            initialData={editingInvoice as IVendorBill}
            onSubmit={createInvoiceMutation as any}
            loading={isLoading}
          />
        </Box>
      </AppModalDialog>
    </>
  );
};

export default withPermission("view", ["accounting"])(VendorBills);
