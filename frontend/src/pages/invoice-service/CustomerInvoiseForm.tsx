import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Grid, Paper, Typography, Box, } from '@mui/material';
import { Send } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { initialinvoiceData } from '@/redux/InitialData/invoice';
import TotalsSection from './components/TotalsSection';
import AttachmentsSection from './components/AttachmentsSection';
import HeaderSection from './components/HeaderSection';
import CustomerSection from './components/CustomerSection';
import NotesSection from './components/NotesSection';
import { generateInvoiceSchema } from './genearateInvoiceSchema';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { IFile, IInvoice } from '@/types';
import ItemsTable from './components/ItemsTable';
import TaxForm from '@/pages/tax-service/TaxForm';
import ProductServiceForm from '@/pages/product-service/ProductServiceForm';
import PaymentTermForm from '@/pages/payment-terms-service/components/PaymentTermForm';
import useDueDateCalculator from '@/utils/DueDateCalulate';
import { useCustomerData } from '../customer-service/utils/useCustomerData';
// import CustomFieldsSection from '@/components/common/CustomFieldsSection';
import { useQuery } from '@tanstack/react-query';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';

interface CustomerInvoiceFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData: IInvoice | null;
  loading: boolean;
}

const CustomerInvoiceForm: React.FC<CustomerInvoiceFormProps> = ({ onSubmit, initialData, loading }) => {
  const [showTaxModal, setShowTaxModal] = React.useState(false)
  const [showProductServiceModal, setShowProductServiceModal] = React.useState(false)
  const [paymenttermModal, setPaymentTermModal] = React.useState(false)
  const [showCustomerModal, setShowCustomerModal] = React.useState(false)
  const [isSubmit, setIsSubmit] = React.useState(false)
  const form = useForm<IInvoice>({
    resolver: yupResolver(generateInvoiceSchema) as any,
    defaultValues: initialData || initialinvoiceData,
  });
  const { handleSubmit, watch, setValue, formState: { errors }, reset } = form;
  const customerId = watch("customerId") as string

  useQuery({
    queryKey: ['productServiceData'],
    queryFn: async () => {
      const response = await apiService.getProductServiceData();
      setValue("productServiceArray", response.data);
      return response.data;
    },
  });

  const handleFormSubmit = async (data: IInvoice, saveAndSend?: boolean) => {
    setIsSubmit(true)
    try {
      const formData = new FormData();

      const invoiceData = {
        ...data,
        files: undefined,
        discountPercent: watch("discountPercent") || 0,
        actionType: saveAndSend  // extra flag for backend
      };
      if (data.files.length > 0) {
        data.files.forEach((file: IFile) => {
          if (file.file && file.file instanceof File) {
            formData.append('files', file.file as File);
          }
        });
      }
      formData.append('invoiceData', JSON.stringify(invoiceData));
      await onSubmit(formData);
    } catch (error: any) {
      console.warn('Submission error:', error);
      // toast.error(error.message);
    } finally {
      setIsSubmit(false)
    }
  };
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,

      });
    }
  }, [initialData]);
  useDueDateCalculator(setValue as any, watch as any);
  useCustomerData({ customerId, form, _id: initialData?._id || "" }); // fetch customer data
  return (
    <>
      <Paper elevation={0} sx={{ px: {xs:2, md:2.7}, py: {xs:3, md:3.5}, border:'1px solid #ddd', borderRadius: 0.5, mt: 1 }}>
        <FormProvider {...form}>
          <form >

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <HeaderSection initialData={initialData} openCustomerModal={() => setShowCustomerModal(true)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <CustomerSection openPaymentTermModal={() => setPaymentTermModal(true)} />
              </Grid>
              <ItemsTable handleTaxModalShow={() => setShowTaxModal(true)} handleProductServiceModalShow={() => setShowProductServiceModal(true)} />
              {/* <Grid item xs={12}>
                <CustomFieldsSection schemaName="Invoice" />
              </Grid> */}
              <Grid item xs={12} md={6}>
                <NotesSection />
                <Typography variant="subtitle2" fontWeight={600} mt={1} mb={1}>
                  Attachments
                </Typography>
                <AttachmentsSection
                  initialData={initialData}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TotalsSection handleTaxModalShow={() => setShowTaxModal(true)} />
              </Grid>
              <ErrorHandlerAlert error={Object.keys(errors).length > 0 ? errors : null} excludedFields={["carrierData", "customerdata", "carrierid", "customerid", "expense"]} />
              <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent:'flex-end', gap: 1.5 }}>
                  {/* Send only */}
                  <Button
                    onClick={handleSubmit((data) => handleFormSubmit(data, false))}
                    disabled={loading || isSubmit}
                    variant="contained"
                    type="button"
                    sx={{ boxShadow: 'none' }}
                  >
                    {loading || isSubmit ? `...Saving` : `Save`}
                  </Button>

                  {/* Save and Send */}
                  <Button
                    onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                    disabled={loading || isSubmit}
                    variant="contained"
                    color="success"
                    sx={{ boxShadow: 'none' }}
                  >
                    {loading || isSubmit ? `...Saving` : `Save & Send`}
                  </Button>
                </Box>
              </Grid>
            </Grid>

          </form>
        </FormProvider>
      </Paper>
      <TaxForm showModal={showTaxModal} handleModalClose={() => setShowTaxModal(false)} editingItem={null} />
      <ProductServiceForm showModal={showProductServiceModal} handleModalClose={() => setShowProductServiceModal(false)} editingItem={null} />
      <PaymentTermForm open={paymenttermModal} onClose={() => setPaymentTermModal(false)} title="Add Payment Term" onSuccess={() => setPaymentTermModal(false)} />
      <UniversalEntityForm id="" entityType="account-customer"  open={showCustomerModal} onClose={() => setShowCustomerModal(false)} />
    </>
  );
};

export default CustomerInvoiceForm;
