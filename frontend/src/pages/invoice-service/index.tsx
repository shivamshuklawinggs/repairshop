import React, { useEffect, useState } from 'react';
import apiService from "@/service/apiService";
import { toast } from "react-toastify";
import moment from 'moment';
import {
  Modal,
  Box,
  Typography,
  Button,
  TableRow,
  TableCell,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  DialogActions,
} from '@mui/material';
import { PageHeader, DataTable, ColumnDef } from '@/components/ui';
import CustomerInvoiseForm from './CustomerInvoiseForm';
import InvoiceEmailReminders from './InvoiceEmailReminders';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { emailStatus, IInvoice, InvoiceResponse, PaymentStatus, TransactionType } from '@/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { initialInvoiseData } from './genearateInvoiceSchema';
import VerticalMenu from '@/components/VerticalMenu';
import {  HasPermission, withPermission } from '@/hooks/authUtils';
import FileUploadButton from '@/components/common/FileUploadButton';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { downloadCSV, getEmailStatus, getInvoiceStatus } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { FileImportError } from '@/components/common/FileImportError';
import {  useNavigate } from 'react-router-dom';
import { getIcon } from '@/components/common/icons/getIcon';
import { downloadInvoicePdf } from '@/utils/downloadInvoicePdf';
import { API_URL } from '@/config';
import { useTransactionMenuActions } from '@/shared/useTransactionMenuActions';
import VerticalMenuInvoice from '@/components/VerticalMenuInvoice';
import TransactionFilters, { TransactionFiltersType } from '@/components/common/TransactionFilters';
import AppModalDialog from '@/components/ui/AppModalDialog';


interface LoadResponse {
  data: InvoiceResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
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

const GetInvoices: React.FC = () => {
  const user = useSelector((state: RootState) => state.user)
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceResponse | typeof initialInvoiseData | null>(initialInvoiseData);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<TransactionFiltersType>({
    search: '',
    paymentStatus: ''as  PaymentStatus,
    emailStatus: "" as emailStatus,
    fromDate: null,
    toDate: null,
    minAmount: '',
    maxAmount: '',
  });


  const fetchInvoices = async (): Promise<LoadResponse> => {
    try {
      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.emailStatus) params.emailStatus = filters.emailStatus;
      if (filters.fromDate) params.fromDate = filters.fromDate.format('YYYY-MM-DD');
      if (filters.toDate) params.toDate = filters.toDate.format('YYYY-MM-DD');
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response: LoadResponse = await apiService.getAccountInvoices(params);
      return response;
    } catch (error) {
      console.warn('Error fetching Invoices:', error);
      throw error;
    }
  };

  const { data, isPending, refetch } = useQuery<LoadResponse>({
    queryKey: ['load-invoices', currentPage, limit, filters],
    queryFn: fetchInvoices,
  });

  const invoiceMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingInvoice?._id) {
        return apiService.updateAccountInvoice(editingInvoice._id, data);
      }
      return apiService.generateAccountInvoice(data);
    },
    onSuccess: (response: any) => {
      refetch();
      toast.success(response?.message || `Invoice ${editingInvoice?._id ? 'updated' : 'created'} successfully`);
      setShowInvoiceModal(false);
      setEditingInvoice(initialInvoiseData);
    },
    onError: (error: any) => {
      toast.error(`Failed to ${editingInvoice?._id ? 'update' : 'create'} invoice`);
      toast.error(error.message);
    },
  });
  const invoiceImportMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importInvoice(formData);
    },
    onSuccess: (response: any) => {
      refetch();
      toast.success(response?.message || `Invoice imported successfully`);
    },
    onError: (error: any) => {
      const allerrors = error?.response?.data?.errors?.allErrors
      if (!allerrors) {
        toast.error(error.message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (InvoicesId: string) => apiService.deleteAccountInvoice(InvoicesId),
    onSuccess: () => {
      toast.success('Invoices deleted successfully');
      refetch();
    },
    onError: (error: any) => {

      toast.error(error.message || 'Failed to delete Invoices');
    },
  });
  const exportCustomersMutation = useMutation({
    mutationFn: () => apiService.exportInvoice(),
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

  const handleCreateInvoice = async (data: any): Promise<void> => {
    invoiceMutation.mutate(data);
  };
  const handleDeleteInvoice = async (InvoiceId: string): Promise<void> => {
    const confirmDelete = window.confirm("Are you sure you want to delete this Invoice?");
    if (confirmDelete) {
      deleteMutation.mutate(InvoiceId);
    }
  };

  const handleInvoiceClick =async (invoice: InvoiceResponse) => {
    if (!invoice) return;
    const response = await apiService.getAccountInvoiceById(invoice._id);
    if(response.data){
      setEditingInvoice(response.data);
      setShowInvoiceModal(true);
    }
  };

  const handleImportInvoice = (file: File) => {
    invoiceImportMutation.mutate({ file });
  };

  const handleSendReminder = (invoice: InvoiceResponse) => {
    setSelectedInvoiceId(invoice._id);
    setShowReminderModal(true);
  };

  const handleViewDetails = (invoice: InvoiceResponse) => {
    setDetailsInvoiceId(invoice._id);
    setShowDetailsModal(true);
  };

  const invoiceColumns: ColumnDef[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'customer', label: 'Customer' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'receivedAmount', label: 'Received Amount' },
    { key: 'balanceDue', label: 'Due Amount' },
    { key: 'status', label: 'Payment Status', align: 'center'},
    { key: 'emailStatus', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
  ];

  return (
    <>
      <Box sx={{ minHeight: '100vh' }}>
        <PageHeader
          title="Invoices"
          subtitle="Manage customer invoices"
          actions={
            <>
              <HasPermission
                action="import"
                resource={["accounting"]}
                component={<FileUploadButton onFileSelect={handleImportInvoice} loading={invoiceImportMutation.isPending} />}
              />
              <HasPermission
                action="export"
                resource={["accounting"]}
                component={
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
                }
              />
              <Tooltip title="Download Sample">
                <IconButton size="small"  href={`${API_URL}public/samples/invoices.csv`}
                  download
                  sx={{
                    color: '#5c626e',
                    '& svg': {
                      fontSize: 22,
                    }
                  }}
                >
                  {getIcon("fileDownload")}
                </IconButton>
              </Tooltip>

              <HasPermission
                action="create"
                resource={["accounting"]}
                component={
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
                }
              />
            </>
          }
        />
        <FileImportError allerrors={invoiceImportMutation?.error?.response?.data?.errors?.allErrors || []} message={invoiceImportMutation?.error?.response?.data?.message || "Error importing invoices"} />

        <TransactionFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
          onClearFilters={() => {
            setFilters({
              search: '',
              paymentStatus: ''as  PaymentStatus,
              emailStatus: "" as emailStatus,
              fromDate: null,
              toDate: null,
              minAmount: '',
              maxAmount: '',
            });
            setCurrentPage(1);
          }}
          showEmailStatus={true}
          searchPlaceholder="Search by invoice number, customer..."
          type="invoice"
        />
{/*  */}
        <DataTable
          columns={invoiceColumns}
          data={Array.isArray(data?.data) ? data.data : []}
          isLoading={isPending}
          total={data?.pagination?.total ?? 0}
          page={currentPage - 1}
          rowsPerPage={limit}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onRowsPerPageChange={(rows) => setLimit(rows)}
          renderRow={(invoice) => (
              <TableRow key={invoice._id}  sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell sx={{whiteSpace:'nowrap'}}>{invoice.invoiceNumber}</TableCell>
              <TableCell title={invoice.customer?.company} className='tellipsis'>{invoice.customer?.company || 'N/A'}</TableCell>
              <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>{invoice?.totalAmount?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{invoice?.receivedAmount?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{invoice?.balanceDue?.toFixed(2) || '0.00'}</TableCell>
              <TableCell align='center'>
                <Chip {...getInvoiceStatus(invoice.balanceDue || 0, invoice.dueDate,TransactionType.INVOICE ,invoice.paymentStatus)}
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
                      type: TransactionType.INVOICE,
                      item: invoice,
                      user,
                      navigate,
                      pdfLoading,
                      onViewDetails: handleViewDetails,
                      onEdit: handleInvoiceClick,
                      onDelete: handleDeleteInvoice,
                      onDownload: (item) => downloadInvoicePdf({
                        invoiceId: item._id,
                        setLoading: setPdfLoading,
                      }),
                      onSendReminder: handleSendReminder,
                    })}
                  />
                </Stack>
              </TableCell>
            </TableRow>
          )}
        />
      </Box>

      {/* Invoice Modal */}
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
            {editingInvoice?._id ? 'Edit Invoice' : 'Create Invoice'}
          </Typography>
          <CustomerInvoiseForm
            initialData={editingInvoice as IInvoice}
            onSubmit={handleCreateInvoice as (data: FormData) => Promise<void>}
            loading={invoiceMutation.isPending}
          />
        </Box>
      </AppModalDialog>

      {/* Invoice Email Reminder Modal */}
      <InvoiceEmailReminders
        open={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setSelectedInvoiceId('');
        }}
        invoiceId={selectedInvoiceId}
      />

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsInvoiceId('');
        }}
        invoiceId={detailsInvoiceId}
      />
    </>
  );
};

export default withPermission("view", ["accounting"])(GetInvoices);
