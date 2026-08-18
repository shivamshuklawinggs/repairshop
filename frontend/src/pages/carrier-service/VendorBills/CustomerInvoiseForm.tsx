import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Grid, Paper, Typography, Box, Alert, } from '@mui/material';
import { Send } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { initialinvoiceData } from '@/redux/InitialData/invoice';
import { toast } from 'react-toastify';
import TotalsSection from './components/TotalsSection';
import AttachmentsSection from './components/AttachmentsSection';
import HeaderSection from './components/HeaderSection';
import CustomerSection from './components/CustomerSection';
import NotesSection from './components/NotesSection';
import { generateInvoiceSchema } from './genearateInvoiceSchema';
import { IFile, IVendorBill } from '@/types';
import ItemsTable from './components/ItemsTable';
import TaxForm from '@/pages/tax-service/TaxForm';
import ProductServiceForm from '@/pages/product-service/ProductServiceForm';
import PaymentTermForm from '@/pages/payment-terms-service/components/PaymentTermForm';
import useDueDateCalculator from '@/utils/DueDateCalulate';
import { useVendorData } from '../utils/useVendorData';
import { useQuery } from '@tanstack/react-query';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';

interface CustomerInvoiceFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData:IVendorBill | null;
  loading: boolean;

}

const CustomerInvoiceForm: React.FC<CustomerInvoiceFormProps> = ({ onSubmit, initialData,loading }) => {
   const [showTaxModal,setShowTaxModal] = React.useState(false)
   const [showProductServiceModal,setShowProductServiceModal] = React.useState(false)
   const [paymentTermModal,setPaymentTermModal] = React.useState(false)
   const [showCustomerModal,setShowCustomerModal] = React.useState(false)
   const [isSubmit,setIsSubmit] = React.useState(false)
  const form = useForm<IVendorBill>({
    resolver: yupResolver(generateInvoiceSchema) as any,
    defaultValues: initialData || initialinvoiceData,
  });
   const { handleSubmit, watch, setValue, formState: { errors },reset } = form;

  /** Fetch product service options */
  const { data: productServiceOptions, isLoading: isProductServiceOptionsLoading } = useQuery({
    queryKey: ['productServiceData'],
    queryFn: async () => {
      const response = await apiService.getProductServiceData();
      return response.data;
    },
  });

  useEffect(() => {
    if (productServiceOptions) {
      setValue("productServiceArray", productServiceOptions);
    }
  }, [productServiceOptions]);

  /** Handle form submission */
  const handleFormSubmit = async (data: any,saveAndSend?:boolean) => {
  
    setIsSubmit(true)
    try {
      const formData = new FormData();

      const invoiceData = {
        ...data,
        files:undefined,
        discountPercent:watch("discountPercent") || 0,
        actionType: saveAndSend  // extra flag for backend
      };
      if(data.files.length >0){
        data.files.forEach((file: IFile) => {
          if(file.file && file.file instanceof File){
            formData.append('files', file.file as File);
          }
        });
      }
      formData.append('invoiceData', JSON.stringify(invoiceData));
      await onSubmit(formData);
    } catch (error: any) {
      console.warn('Submission error:', error);
      toast.error(error.message);
    }finally{
      setIsSubmit(false)
    }
  };
  useEffect(() => {

    if(initialData){
       reset({
        ...initialData,
        email:initialData.email || ""
       });
    }
  }, [initialData]);



  useVendorData({vendorId:form.watch("vendorId"),form:form, _id:form.watch("_id") as string})
  useDueDateCalculator(setValue as any,watch as any);
  return (
    <>
    <Paper elevation={0} sx={{ px: {xs:2, md:2.7}, py: {xs:3, md:3.5}, border:'1px solid #ddd', borderRadius:0.5, mt:1}}>
      <FormProvider {...form}>
      <form >

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <HeaderSection initialData={initialData} openCustomerModal={()=>setShowCustomerModal(true)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomerSection openPaymentTermModal={()=>setPaymentTermModal(true)}   />
            </Grid>
            <ItemsTable handleTaxModalShow={()=>setShowTaxModal(true)} handleProductServiceModalShow={()=>setShowProductServiceModal(true)}  />
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
              <TotalsSection handleTaxModalShow={()=>setShowTaxModal(true)}/>
            </Grid>
            {
              // Error message show in alert
              Object.entries(errors).filter(([key, value]) =>!["carrierData","customerdata","carrierid","customerid"].includes(key)).map(([key, value]) => (
                <Alert key={key} severity="error" sx={{ mb: 0, mt:1.6, ml:2}}>
                  {value?.message}
                </Alert>
              ))
            }
          <Grid item xs={12} md={12}>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent:'flex-end'}}>
      {/* Send only */}
        <Button
        onClick={handleSubmit((data) => handleFormSubmit(data, false))}
        disabled={loading || isSubmit || isProductServiceOptionsLoading }
        variant="contained"
        sx={{boxShadow:'none'}}
      >
        {loading || isSubmit ? `...Saving` : `Save`}
      </Button>

      {/* Save and Send */}
      <Button
        onClick={handleSubmit((data) => handleFormSubmit(data, true))}
        disabled={loading || isSubmit || isProductServiceOptionsLoading }
        variant="contained"
        color="success"
        sx={{boxShadow:'none'}}
      >
        {loading || isSubmit ? `...Saving` : `Save & Send`}
      </Button>
           </Box>
            </Grid>
          </Grid>

      </form>
      </FormProvider>
    </Paper>
       <TaxForm showModal={showTaxModal} handleModalClose={()=>setShowTaxModal(false)} editingItem={null} />
       <ProductServiceForm showModal={showProductServiceModal} handleModalClose={()=>setShowProductServiceModal(false)} editingItem={null} />
       <PaymentTermForm open={paymentTermModal} onClose={()=>setPaymentTermModal(false)} title="Create Payment Term" />
       <UniversalEntityForm open={showCustomerModal} onClose={()=>setShowCustomerModal(false)} entityType="vendor" id='' />
    </>
  );
};

export default CustomerInvoiceForm;
