import React, { useState, useMemo, useCallback } from 'react';
import {
  Container,
  TableCell,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Chip,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { DataTable } from '@/components/ui';
import {  useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { IPayment, PaymentType } from '@/types';
import apiService from '@/service/apiService';
import { capitalizeFirstLetter, formatCurrency, getPaymentStatus } from '@/utils';
import { paths } from '@/utils/paths';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import VerticalMenu from '@/components/VerticalMenu';
import { useTransactionMenuActions } from '@/shared/useTransactionMenuActions';
import { TransactionType } from '@/types';
import { SelectOption } from '@/components/ui/FormSelect';
import useDebounce from '@/hooks/useDebounce';
import useDepositToOptions from '@/hooks/DepositToOptions';
import TransactionFilters, { TransactionFiltersType } from '@/components/common/TransactionFilters';
import { formatDate } from '@/utils/dateUtils';

const PaymentsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient()
  const currentUser = useSelector((state: RootState) => state.user);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersType>({
    search: '',
    paymentStatus: '' as any,
    emailStatus: undefined,
    fromDate: null,
    toDate: null,
    minAmount: '',
    maxAmount: '',
    // Payment-specific fields
    paymentType: '',
    status: '',
    paymentMethod: '',
    depositTo: '',
  });

  const debouncedSearchTerm = useDebounce(filters.search, 500);


  const { data: paymentsResponse, isLoading, error } = useQuery({
    queryKey: ['payments', page, rowsPerPage, debouncedSearchTerm, filters.fromDate, filters.toDate, filters.paymentType, filters.status, filters.paymentMethod, filters.depositTo],
    queryFn: async () => {
      const params: any = {
        page: page , // API uses 1-based indexing
        limit: rowsPerPage,
      };
      if (filters.fromDate) params.fromDate = filters.fromDate.toISOString();
      if (filters.toDate) params.toDate = filters.toDate.toISOString();
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (filters.paymentType) params.paymentType = filters.paymentType;
      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.depositTo) params.depositTo = filters.depositTo;
      const response = await apiService.getAllPayments(params);
      return response || { data: [], page: 1, limit: 10, total: 0 };
    },
    enabled: !!currentUser.currentCompany,
  });

  const payments = paymentsResponse?.data || [];
  const totalCount = paymentsResponse?.total || 0;

  // Filter options
  const paymentTypeOptions: SelectOption[] = useMemo(() => [
    { value: PaymentType.invoice, label: 'Invoice' },
    { value: PaymentType.bill, label: 'Bill' },
  ], []);

  const statusOptions: SelectOption[] = useMemo(() => [
    { value: 'Settled', label: 'Settled' },
    { value: 'Unsettled', label: 'Unsettled' },
  ], []);

  const paymentMethodOptions: SelectOption[] = useMemo(() => [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit card', label: 'Credit Card' },
    { value: 'bank transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ], []);


     const { DepositToOptions } = useDepositToOptions(["Bank", "Credit Card"]);

  // Filter out disabled options and ensure proper typing
  const filteredDepositToOptions: SelectOption[] = useMemo(() =>
    DepositToOptions
      .filter(option => !option.disabled && option.value !== undefined)
      .map(option => ({
        value: option.value!,
        label: option.label,
      })), [DepositToOptions]
  );



  const getTypeColor = (type: PaymentType) => {
    switch (type) {
      case PaymentType.invoice:
        return 'primary';
      case PaymentType.bill:
        return 'primary';
      default:
        return 'default';
    }
  };

const handleView = (payment: IPayment) => {
   if(payment.PaymentType===PaymentType.invoice){
    navigate(`${paths.recievedpayment}/${payment._id}`);
   }
   if(payment.PaymentType===PaymentType.bill){
    navigate(`${paths.recievedbill}/${payment._id}`);
   }
};
const handleDelete = async (payment: IPayment) => {
   try {
       // ask irst to delete
      const Isdeklete=confirm("Are you sure you want to delete this payment?")
      if (Isdeklete) {
       await  apiService.deleteRecivedPayment(payment._id);
        toast.success("Payment deleted successfully");
        queryClient.invalidateQueries({ queryKey: ['payments', page, rowsPerPage, debouncedSearchTerm, filters.fromDate, filters.toDate, filters.paymentType, filters.status, filters.paymentMethod, filters.depositTo] });
      }
   } catch (error:any) {
      toast.error(error.message || "Something went wrong");
   }
};

const handleViewDetails = (payment: IPayment) => {
  handleView(payment);
};

const handleDeleteById = (id: string) => {
  const payment = payments.find((p: IPayment) => p._id === id);
  if (payment) {
    handleDelete(payment);
  }
};
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Error loading payments: {error.message}</Typography>
      </Box>
    );
  }


  return (
   <>
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      flexWrap="wrap"
      gap={1}
    >
      <Box>
          <Typography fontWeight={600} fontSize={{xs:16, md:17}}>
           Payments Management
          </Typography>
          <Typography fontSize={{xs:13, md:14}} color="text.secondary">
            Search, filter, and manage payment records
          </Typography>
      </Box>

    </Box>

    <Container style={{maxWidth:'100%', padding:'0px'}}>
      <TransactionFilters
        type="payments"
        filters={filters}
        expanded={filtersExpanded}
        onExpandedChange={setFiltersExpanded}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onClearFilters={() => {
            setFilters({
              search: '',
              paymentStatus: '' as any,
              emailStatus: undefined,
              fromDate: null,
              toDate: null,
              minAmount: '',
              maxAmount: '',
              paymentType: '',
              status: '',
              paymentMethod: '',
              depositTo: '',
            });
            setPage(1)
          }}
        paymentTypeOptions={paymentTypeOptions}
        statusOptions={statusOptions}
        paymentMethodOptions={paymentMethodOptions}
        depositToOptions={filteredDepositToOptions}
        searchPlaceholder="Search by reference, customer..."
      />

      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'referenceNo', label: 'Reference No' },
          { key: 'customer', label: 'Customer' },
          { key: 'type', label: 'Type', align:'center' },
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'status', label: 'Status', align:'center' },
          { key: 'credits', label: 'Credits Left' },
          { key: 'settledAmount', label: 'Settled Amount' },
          { key: 'amount', label: 'Amount' },
          { key: 'action', label: 'Action', align:'center' },
        ]}
        data={payments}
        isLoading={isLoading}
        emptyMessage="No payments found"
        total={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
        renderRow={(payment: IPayment) => (
          <TableRow key={payment._id} hover>
            <TableCell sx={{whiteSpace:'nowrap'}}>{formatDate(payment.paymentDate)}</TableCell>
            <TableCell>{payment.referenceNo}</TableCell>
            <TableCell title={payment.customer?.name} className='tellipsis'>{payment.customer?.name || 'N/A'}</TableCell>
            <TableCell align='center'>
              <Chip label={payment.PaymentType || 'N/A'} color={getTypeColor(payment.PaymentType || '')}
              variant='outlined'
              size="small"
              sx={{
                height:'auto',
                fontSize:'12px',
                borderRadius:0.4,
                fontWeight:'600',
                '& .MuiChip-label':{
                  px:1,
                }
               }}
              />
            </TableCell>
            <TableCell sx={{whiteSpace:'nowrap'}}>{capitalizeFirstLetter(payment.paymentMethod)}</TableCell>
               <TableCell align='center'>
                <Chip {...getPaymentStatus(payment.status)}
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
            <TableCell>{formatCurrency(payment.credits)}</TableCell>
            <TableCell>{formatCurrency(payment.settledAmount)}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell align="center">
              <VerticalMenu
                actions={useTransactionMenuActions({
                  type: TransactionType.PAYMENT,
                  item: payment,
                  user: currentUser,
                  navigate,
                  showDownload: false,
                  showPayment: false,
                  showReminder: false,
                  showEdit: false,
                  onViewDetails: handleViewDetails,
                  onDelete: handleDeleteById,
                })}
              />
            </TableCell>
          </TableRow>
        )}
      />
    </Container>
    </>
  );
};

export default PaymentsList;