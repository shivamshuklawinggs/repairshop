import React, { useState } from 'react';
import { PageHeader, DataTable } from '@/components/ui';
import apiService from "@/service/apiService";
import { toast } from "react-toastify";
import moment from 'moment';
import { Modal, Box, Typography, Button, TableRow, TableCell, Chip, DialogActions } from '@mui/material';
import CustomerInvoiseForm from './CustomerInvoiseForm';
import { IInvoice, InvoiceResponse, PaymentStatus, TransactionType } from '@/types';
import { RootState } from '@/redux/store';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { initialInvoiseData } from './genearateInvoiceSchema';
import VerticalMenu from '@/components/VerticalMenu';
import { hasAccess, HasPermission, withPermission } from '@/hooks/authUtils';
import { formatDate } from '@/utils/dateUtils';
import { getEmailStatus, getInvoiceStatus } from '@/utils';
import { getIcon } from '@/components/common/icons/getIcon';
import { downloadInvoicePdf } from '@/utils/downloadInvoicePdf';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceResponse | typeof initialInvoiseData>(initialInvoiseData);

  const user = useSelector((state: RootState) => state.user)

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
        type: "customer",
      };

      if (filters.search) params.search = filters.search;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.fromDate) params.fromDate = filters.fromDate.format('YYYY-MM-DD');
      if (filters.toDate) params.toDate = filters.toDate.format('YYYY-MM-DD');
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response: LoadResponse = await apiService.getAccountEstimates(params);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const { data, isPending, refetch } = useQuery<LoadResponse>({
    queryKey: ['load-invoices', currentPage, limit, filters],
    queryFn: fetchLoads,
  })

  const invoiceMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingInvoice?._id) {
        return apiService.updateEstimateInvoice(editingInvoice._id, data, "customer");
      }
      return apiService.generateEstimateInvoice(data, "customer");
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

  const deleteMutation = useMutation({
    mutationFn: (loadId: string) => apiService.deleteEstimateInvoice(loadId),
    onSuccess: () => {
      toast.success('estimate deleted successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete estimate');
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiService.convertEstimateToInvoice(id),
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Estimate converted to invoice successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to convert estimate to invoice');
    },
  });

  const handleCreateInvoice = async (data: any): Promise<void> => {
    invoiceMutation.mutate(data);
  };

  const handleDeleteLoad = async (loadId: string): Promise<void> => {
    const confirmDelete = window.confirm("Are you sure you want to delete this load?");
    if (confirmDelete) {
      deleteMutation.mutate(loadId);
    }
  }
  const handleInvoiceClick =async (
    invoice?: InvoiceResponse
  ) => {
    const data = invoice || initialInvoiseData;
    if(data._id){
        const response = await apiService.getAccountEstimatesById(data._id);
        if(response.data){
          setEditingInvoice(response.data);
          setShowInvoiceModal(true);
          return
        }
    }
    setEditingInvoice(data);
    setShowInvoiceModal(true);
  };
  const handleConvertEstimateToInvoice = async (id: string) => {
    convertToInvoiceMutation.mutate(id);
  }
  return (
    <>
      <Box sx={{ minHeight: '100vh' }}>
          <PageHeader
            title="Estimates"
            subtitle="Manage customer estimates and quotes"
            actions={
              <HasPermission action="create" resource={["accounting"]} component={
                <Button className='themBtn' variant="contained" size="small"
                startIcon={getIcon("plus")} onClick={() => handleInvoiceClick(undefined)}
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
              }/>
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
            searchPlaceholder="Search by estimate number, customer..."
            type="estimate"
          />

          <DataTable
            columns={[
              { key: 'estimateNumber', label: 'Estimate #' },
              { key: 'customer', label: 'Customer' },
              { key: 'invoiceDate', label: 'Invoice Date' },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'totalAmount', label: 'Total Amount' },
              { key: 'receivedAmount', label: 'Received Amount' },
              { key: 'balanceDue', label: 'Due Amount' },
              { key: 'status', label: 'Status', align: 'center' },
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
              <TableRow key={invoice._id}  sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell title={invoice.customer?.company} className='tellipsis'>{invoice.customer?.company || 'N/A'}</TableCell>
                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell>{invoice?.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{invoice?.receivedAmount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{invoice?.balanceDue?.toFixed(2) || '0.00'}</TableCell>
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
                  <VerticalMenu actions={[
                    hasAccess(["accounting"],"update",user) ? { label: "Edit", icon: "edit", onClick: () => handleInvoiceClick(invoice) } : null,
                    hasAccess(["accounting"],"delete",user) ? { label: "Delete", icon: "delete", onClick: () => handleDeleteLoad(invoice._id) } : null,
                    hasAccess(["accounting"],"export",user) ? { label: "Download",icon: "fileDownload", onClick: () => downloadInvoicePdf({
                                            invoiceId: invoice._id,
                                            title:"Estimate"
                                          }) } : null,
                    hasAccess(["accounting"],"update",user) ? { label: "Convert to Invoice", icon: "convert", onClick: () => handleConvertEstimateToInvoice(invoice._id) } : null,
                  ]} />
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
            {editingInvoice?._id ? 'Edit  Estimate' : 'Create  Estimate'}
          </Typography>
          <CustomerInvoiseForm
            initialData={editingInvoice as IInvoice}
            onSubmit={handleCreateInvoice as (data: FormData) => Promise<void>}
            loading={invoiceMutation.isPending}
          />
        </Box>
      </AppModalDialog>
    </>
  );
};

export default withPermission("view",["accounting"])(GetInvoices);
