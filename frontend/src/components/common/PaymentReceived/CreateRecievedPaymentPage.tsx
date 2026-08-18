import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Typography, Grid } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { formatCurrency } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { IPaymentRecived, ICustomerInvoicesPaymentDetails, recievedPaymentparmaSearchProps } from '@/types';
import useDebounce from '@/hooks/useDebounce';
import { RecievedPamentSchema } from '@/components/common/PaymentReceived/payment.validate';
import { toast } from 'react-toastify';
import { useParams, useSearchParams } from 'react-router-dom';
import { todayDate } from '@/config/constant';
import FilterData from './FilterData';
import CreateRecievedPaymentFormFields from './CreateRecievedPaymentFormFields';
import SharedOutStandingTransactions from '@/components/common/PaymentReceived/SharedOutStandingTransactions';
import { DocumentType } from '@/components/common/PaymentReceived/SharedOutStandingTransactions';

interface CreateRecievedPaymentPageProps {
  documentType: DocumentType;
  pageTitle: string;
  outstandingLabel: string;
  customerLabel?: string;
  depositToLabel?: string;
  amountLabel?: string;
  searchLabel?: string;
  tooltipText?: string;
  getDisplayName: (customer: any) => string;
  getCustomersQueryFn: () => Promise<any[]>;
  getDocumentsByCustomerQueryFn: (params: recievedPaymentparmaSearchProps) => Promise<any>;
  customersQueryKey: string;
  documentsQueryKey: string;
  searchParamKey?: string;
  successMessage?: string;
}

const CreateRecievedPaymentPage: React.FC<CreateRecievedPaymentPageProps> = ({
  documentType,
  pageTitle,
  outstandingLabel,
  customerLabel = 'Customer',
  depositToLabel = 'Received In',
  amountLabel = 'Amount Received',
  searchLabel,
  tooltipText,
  getDisplayName,
  getCustomersQueryFn,
  getDocumentsByCustomerQueryFn,
  customersQueryKey,
  documentsQueryKey,
  searchParamKey,
  successMessage,
}) => {
  const [SearchParams] = useSearchParams();
  const { customerId = '' } = useParams<{ customerId: string }>();

  const formProps = useForm<IPaymentRecived>({
    resolver: yupResolver(RecievedPamentSchema) as any,
    mode: 'all',
    defaultValues: {
      paymentDate: new Date(),
      invoicePayments: [],
      depositTo: "",
      customer: '',
      postingDate: new Date(),
      paymentMethod: '',
      referenceNo: '',
      amount: 0,
      searchInvoice: '',
      fromDate: null,
      toDate: null,
      overdueOnly: '',
    },
  });

  const { handleSubmit, reset, watch, setValue } = formProps;
  const watchedFields = watch();
  const searchInvoiceDebounced = useDebounce(watchedFields.searchInvoice, 500);

  const paramSearch: recievedPaymentparmaSearchProps = useMemo(() => ({
    invoiceNumber: searchInvoiceDebounced,
    fromDate: formatDate(watchedFields?.fromDate ??undefined),
    toDate: formatDate(watchedFields.toDate ??undefined),
    overdueOnly: watchedFields.overdueOnly,
    customerId: watchedFields.customer,
  }), [searchInvoiceDebounced, watchedFields.fromDate, watchedFields.toDate, watchedFields.overdueOnly, watchedFields.customer]);

  const { data: customerData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: [customersQueryKey],
    queryFn: getCustomersQueryFn,
  });

  const { mutateAsync: submitPayment, isPending: isPendingUpdate } = useMutation({
    mutationFn: async (payload: {
      invoicePayments: Array<{ invoiceId: string; amount: number }>;
      paymentDate: Date;
      paymentMethod: string;
      referenceNo: string;
      customerId: string;
      depositTo: string;
      amount: number;
      postingDate: Date;
    }) => apiService.updateInvoicePayments(payload, documentType === 'bills' ? 'bill' : 'invoice'),
    onSuccess: (data) => {
      toast.success(successMessage || data?.message || 'Payment has been created successfully!');
      getCustomerData.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'An error occurred while submitting the payment.');
    },
  });

  const getCustomerData = useQuery({
    queryKey: [documentsQueryKey, paramSearch],
    queryFn: () => getDocumentsByCustomerQueryFn(paramSearch),
    enabled: !!paramSearch.customerId,
  });

  const customerInvoices: ICustomerInvoicesPaymentDetails[] = getCustomerData.data?.data || [];
  const customerBalance = getCustomerData.data?.totalBalance || 0;

  const handleCustomerChange = (id: string) => {
    if (!id) { reset(); return; }
    setValue('customer', id);
  };

  const onSubmit = async (data: IPaymentRecived) => {
    try {
      const invoicePayments = (data.invoicePayments || [])
        .filter(invoice => invoice.amount > 0)
        .map(({ invoiceId, amount }) => ({ invoiceId, amount }));
      await submitPayment({
        invoicePayments,
        paymentDate: data.paymentDate || todayDate,
        paymentMethod: data.paymentMethod,
        referenceNo: data.referenceNo,
        customerId: data.customer,
        depositTo: data.depositTo,
        amount: data.amount,
        postingDate: data.postingDate,
      });
      const currentCustomer = data.customer;
      const currentAmount = data.amount;
      reset({ customer: currentCustomer, amount: currentAmount });
    } catch (error: any) {
      toast.error(error.message || "Failed to create payment");
    }
  };

  const handleClear = () => {
    const currentCustomer = watch('customer');
    reset();
    setValue('customer', currentCustomer);
  };

  useEffect(() => {
    if (customerId) setValue('customer', customerId);
  }, [customerId, setValue]);

  useEffect(() => {
    if (searchParamKey && SearchParams.get(searchParamKey)) {
      setValue('searchInvoice', SearchParams.get(searchParamKey) as string);
    }
  }, [SearchParams, searchParamKey]);

  useEffect(() => {
    formProps.trigger('amount');
  }, [watch('invoicePayments')]);

  return (
    <FormProvider {...formProps}>
      <Box sx={{ p:{xs:2, md:3}, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="600">{pageTitle}</Typography>
          <Typography fontSize={{xs:16, md:18}} fontWeight="bold">{formatCurrency(customerBalance)}</Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <CreateRecievedPaymentFormFields
              customerData={customerData || []}
              isLoading={isLoadingCustomers}
              handleCustomerChange={handleCustomerChange}
              customerInvoices={customerInvoices}
              customerLabel={customerLabel}
              depositToLabel={depositToLabel}
              amountLabel={amountLabel}
              searchLabel={searchLabel}
              tooltipText={tooltipText}
              getDisplayName={getDisplayName}
            />
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {outstandingLabel}
              </Typography>
              <FilterData isLoading={isLoadingCustomers || isPendingUpdate} />
              {customerInvoices.length > 0 && (
                <SharedOutStandingTransactions
                  isLoading={isLoadingCustomers || isPendingUpdate}
                  documentType={documentType}
                  showSummary={true}
                  customerInvoices={customerInvoices}
                  formContextType="IPaymentRecived"
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleClear}>Clear</Button>
                <Button variant="contained" type="submit" disabled={isPendingUpdate}>
                  {isPendingUpdate ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </FormProvider>
  );
};

export default CreateRecievedPaymentPage;
