import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Typography, Grid } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { formatCurrency } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { recievedPaymentparmaSearchProps } from '@/types';
import useDebounce from '@/hooks/useDebounce';
import { UpdateRecievedPamentSchema, UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { todayDate } from '@/config/constant';
import { getFullName } from '@/utils';
import SharedOutStandingTransactions from '@/components/common/PaymentReceived/SharedOutStandingTransactions';
import FilterData from './FilterData';
import EditRecievedPaymentFormFields from './EditRecievedPaymentFormFields';
import UpdateRecievepayment from './UpdateRecievepayment';
import { DocumentType } from '@/components/common/PaymentReceived/SharedOutStandingTransactions';

interface EditRecievedPaymentPageProps {
  documentType: DocumentType;
  pageTitle: string;
  outstandingLabel: string;
  customerLabel?: string;
  depositToLabel?: string;
  amountLabel?: string;
  searchLabel?: string;
  getDocumentsByCustomerQueryFn: (params: recievedPaymentparmaSearchProps) => Promise<any>;
  documentsQueryKey: string;
}

const EditRecievedPaymentPage: React.FC<EditRecievedPaymentPageProps> = ({
  documentType,
  pageTitle,
  outstandingLabel,
  customerLabel,
  depositToLabel,
  amountLabel,
  searchLabel,
  getDocumentsByCustomerQueryFn,
  documentsQueryKey,
}) => {
  const [paymentData, setPaymentData] = useState<any>(null);
  const { id } = useParams<{ id: string }>();

  const formProps = useForm<UpdateRecievedPamentSchemaType>({
    resolver: yupResolver(UpdateRecievedPamentSchema) as any,
    mode: 'all',
    defaultValues: {
      paymentDate: new Date(),
      invoicePayments: [],
      recievedPayments: [],
      deletedPayments: [],
      depositTo: "",
      customer: undefined,
      paymentMethod: '',
      postingDate: new Date(),
      amount: 0,
      referenceNo: '',
      searchInvoice: '',
      fromDate: null,
      toDate: null,
      overdueOnly: '',
    },
  });

  const { handleSubmit, reset, watch, setValue, trigger } = formProps;
  const watchedFields = watch();
  const searchInvoiceDebounced = useDebounce(watchedFields.searchInvoice, 500);

  const paramSearch: {
     invoiceNumber: string, fromDate: string, toDate: string, overdueOnly: string
  } = {
    invoiceNumber: searchInvoiceDebounced || "",
    fromDate: formatDate(watchedFields.fromDate ?? undefined) || "",
    toDate: formatDate(watchedFields.toDate ?? undefined),
    overdueOnly: watchedFields.overdueOnly || "",
  };

  const { data:recivedPaymentData,isLoading: isLoadingRecivedPayment, refetch } = useQuery({
    queryKey: ['getrecivedPayment', id],
    queryFn: async () => {
      const recivedPaymentData = await apiService.getrecivedPayment(id!, {
        ...paramSearch,
        type: documentType === 'bills' ? 'bill' : 'invoice',
      });
      if (recivedPaymentData) {
        setPaymentData(recivedPaymentData);
        setValue('recievedPayments', recivedPaymentData?.recievedPayments || []);
        setValue('amount', recivedPaymentData.amount || 0);
        setValue('paymentDate', recivedPaymentData.paymentDate || todayDate);
        setValue('paymentMethod', recivedPaymentData.paymentMethod || "");
        setValue('referenceNo', recivedPaymentData.referenceNo || "");
        setValue('depositTo', recivedPaymentData.depositTo || "");
        setValue('customer', recivedPaymentData.customerId || {});
      }
      return recivedPaymentData;
    },
    enabled: !!id,
  });

  const getCustomerData = useQuery({
    queryKey: [documentsQueryKey, paramSearch],
    queryFn: () => getDocumentsByCustomerQueryFn({...paramSearch, customerId: recivedPaymentData?.customerId || ""}),
    enabled: !!recivedPaymentData?.customerId,
  });

  const customerInvoices = getCustomerData.data?.data || [];

  const { mutateAsync: updatePayments, isPending: isPendingUpdatePayments } = useMutation({
    mutationFn: async (payload: UpdateRecievedPamentSchemaType) => {
      const response = await apiService.updateRecivedPayment(
        id!,
        { ...payload, customerId: payload.customer },
        documentType === 'bills' ? 'bill' : 'invoice'
      );
      reset({ customer: payload.customer });
      refetch();
      toast.success("Payment Updated SuccessFully")
      return response;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update payment");
    },
  });

  const onSubmit = async (data: UpdateRecievedPamentSchemaType) => {
    try {
      await updatePayments(data);
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the payment.");
    } finally {
      refetch();
    }
  };

  const handleClear = () => {
    reset();
    refetch();
  };

  useEffect(() => {
    if (recivedPaymentData?.customerId) setValue("customer", recivedPaymentData.customerId);
  }, [recivedPaymentData?.customerId, setValue]);

  useEffect(() => {
    trigger('amount');
  }, [watchedFields.invoicePayments, watchedFields.recievedPayments, trigger]);

  return (
    <FormProvider {...formProps}>
      <Box sx={{ p:{xs:2, md:3}, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography fontSize={15} fontWeight="600">{pageTitle}</Typography>
          <Typography variant="h5" fontWeight="bold">
            {formatCurrency(paymentData?.totalBalance || 0)}
          </Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <EditRecievedPaymentFormFields
              isLoading={isLoadingRecivedPayment}
              customerLabel={customerLabel}
              depositToLabel={depositToLabel}
              amountLabel={amountLabel}
              searchLabel={searchLabel}
              customerName={getFullName(paymentData?.customer || {})}
            />
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {outstandingLabel}
              </Typography>
              <FilterData isLoading={isLoadingRecivedPayment || isPendingUpdatePayments} />
              <SharedOutStandingTransactions
                isLoading={isLoadingRecivedPayment || isPendingUpdatePayments || getCustomerData.isLoading}
                documentType={documentType}
                showSummary={false}
                customerInvoices={customerInvoices}
                formContextType={documentType === 'invoices' ? 'UpdateRecievedPamentSchemaType' : 'none'}
                tableContainerSx={{ mt: 3, mb: 3 }}
              />
              <UpdateRecievepayment
                isLoading={isLoadingRecivedPayment || isPendingUpdatePayments}
                documentLabel={documentType === 'invoices' ? 'Invoice' : 'Bill'}
                nonRecievedPayments={paymentData?.nonRecievedPayments || []}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleClear}>Clear</Button>
                <Button variant="contained" type="submit" disabled={isPendingUpdatePayments}>
                  {isPendingUpdatePayments ? "Submitting..." : "Submit"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </FormProvider>
  );
};

export default EditRecievedPaymentPage;
