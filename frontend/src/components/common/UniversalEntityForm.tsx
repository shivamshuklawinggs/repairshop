import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  alpha,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import {
  Business,
  LocationOn,
  Description,
  AttachFile,
  Shield,
  Contacts,
  LocalShipping,
  AccountBalance,
  ContactPage
} from '@mui/icons-material';
import { useForm, FormProvider, Control, useWatch, Controller, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import apiService from '@/service/apiService';
import { ICustomer, ICarrier } from '@/types';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import { getIcon } from '@/components/common/icons/getIcon';
import PaymentTermForm from '@/pages/payment-terms-service/components/PaymentTermForm';
import { accountingCustomerSchema, defaultAccountingCustomerData } from '@/shared/schema/CustomerSchema';
import {vendorFormSchema, defaultVendorData} from '@/shared/schema/CarrierSchema';
import AppDialog from '@/components/ui/AppDialog';

// Shared Components - All components now come from shared folder
import {
  
  SharedDocuments,
  SharedCompanySection
} from '@/shared/components';

// Remaining non-shared components
import BillingAddress from '@/components/common/form/BillingAddress';
import ShippingAddress from '@/components/common/form/ShippingAddress';
import AccountsInfo from '@/components/common/form/AccountsInfo';

import TruckDetails from './form/TruckDetails';

export type EntityType = 'account-customer' | 'vendor';

interface UniversalEntityFormProps {
  entityType: EntityType;
  open: boolean
  onClose: () => void;
  onUpdate?: () => void;
  id:string
}

interface FormConfig {
  title: string;
  icon: React.ReactNode;
  schema: any;
  defaultValues: any;
  queryKey: string;
  apiMethods: {
    get: (id: string) => Promise<any>;
    create: (data: FormData) => Promise<any>;
    update: (id: string, data: FormData) => Promise<any>;
  };
  invalidateKeys: string[];
  sections: {
    companySection: React.ComponentType<any>;
    additionalSections: Array<{
      title: string;
      icon?: React.ReactNode;
      component: React.ComponentType<any>;
      updateComponent?: React.ComponentType<any>;
      condition?: (data: any) => boolean;
    }>;
  };
}



const UniversalEntityForm: React.FC<UniversalEntityFormProps> = ({
  entityType,
  open,
  onClose,
  onUpdate,
  id
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [localUsdot, setLocalUsdot] = useState('');
  const config = useMemo((): FormConfig => {
    switch (entityType) {
      case 'account-customer': {
        return {
          title: 'Customer',
          icon: <ContactPage />,
          schema: accountingCustomerSchema,
          defaultValues: defaultAccountingCustomerData,
          queryKey: 'accountsCustomer',
          apiMethods: {
            get: apiService.getAccountsCustomer,
            create: apiService.createAccountsCustomer,
            update: apiService.updateAccountsCustomer,
          },
          invalidateKeys: ['accountsCustomers', 'accountsCustomerInvoice'],
          sections: {
            companySection: (props: any) => <SharedCompanySection {...props} entity={entityType} showUSDOT={true} showMCNumber={true} showNickName showDisplayName showMobileNo showFax showOther showWebsite showNameToPrintOnCheck showIsSubCustomer />,
            additionalSections: [
              {
                title: 'Shipping Address',
                component: (props: any) => <ShippingAddress {...props} showSameAsCheckbox={false} checkboxTitle="Same As Billing Address" fieldName="sameAsBillingAddress" sourceAddress="billingAddress" targetAddress="shippingAddress" />,
                condition: ({isRepairCompany}) => !isRepairCompany
              },
              {
                title: 'Billing Address',
                component: (props: any) => <BillingAddress {...props} showSameAsCheckbox={true} checkboxTitle="Same As Shipping Address" fieldName="sameAsPhysicalAddress" sourceAddress="shippingAddress" targetAddress="billingAddress" />,
                condition: ({isRepairCompany}) => !isRepairCompany
              },
              {
                title: 'Truck Details',
                component:(props)=> <TruckDetails {...props}/>,
              },

              {
                title: 'Notes & Attachments',
                component: (props: any) => <SharedDocuments {...props} uploadUrl="CUSTOMER_DOCUMENTS_UPLOAD_URL" title="Notes & Attachments" />
              },
              {
                title: 'Accounting & Payments',
                component: AccountsInfo
              }
            ]
          }
        };
      }
      case 'vendor': {
        return {
          title: 'Vendor',
          icon: <Business />,
          schema: vendorFormSchema,
          defaultValues: defaultVendorData,
          queryKey: 'vendor',
          apiMethods: {
            get: apiService.getVendor,
            create: apiService.createVendor,
            update: apiService.updateVendor,
          },
          invalidateKeys: ['vendors', 'accountsCustomerBills'],
          sections: {
            companySection: (props: any) => <SharedCompanySection {...props} entity={entityType} showUSDOT={false} showMCNumber={false} showDisplayName showMobileNo showFax showOther showWebsite showNameToPrintOnCheck showIsSubVendor />,
            additionalSections: [
                {
                title: 'Billing Address',
                component: (props: any) => <BillingAddress {...props} showSameAsCheckbox={false} checkboxTitle="Same As Shipping Address" fieldName="sameAsShippingAddress" sourceAddress="shippingAddress" targetAddress="billingAddress" />
              },
              {
                title: 'Shipping Address',
                component: (props: any) => <ShippingAddress {...props} showSameAsCheckbox={true} checkboxTitle="Same As Billing Address" fieldName="sameAsBillingAddress" sourceAddress="billingAddress" targetAddress="shippingAddress" />
              },
              {
                title: 'Notes And Attachments',
                component: (props: any) => <SharedDocuments {...props} uploadUrl="CARRIER_DOCUMENTS_UPLOAD_URL" title="Notes And Attachments" />
              },
              {
                title: 'Accounting Payments',
                component: AccountsInfo
              }
            ]
          }
        };
      }
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }, [entityType, open, localUsdot]);

  const form = useForm({
    mode: 'all',
    resolver: yupResolver(config.schema) as any,
    defaultValues: config.defaultValues,
  });
  const withoutUsdot = useWatch({ control: form.control, name: 'withoutUsdot' });
  const entityDetails = useWatch({ control: form.control, name: 'entityDetails' });
  console.log("entityDetails", entityDetails)
  console.log("errrrr", form.formState.errors)
  const hasData = Object.values(entityDetails || {}).some((value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return !!value;
});

  const { data: entityData, isFetching } = useQuery({
    queryKey: [config.queryKey, id],
    queryFn: async () => {
      if (!id) return config.defaultValues;
      const response = await config.apiMethods.get(id as string);
      return response.data || config.defaultValues;
    },
    enabled: !!open
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (id) {
        return config.apiMethods.update(id, formData);
      }
      return config.apiMethods.create(formData);
    },
    onSuccess: () => {
      toast.success(id ? `${config.title} updated successfully` : `${config.title} created successfully`);
      config.invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      setHasError(false);
      onUpdate?.();
      onClose();
    },
    onError: (error: any) => {
      setHasError(true);
      toast.error(error.message || `Failed to save ${config.title.toLowerCase()}`);
    },
  });

  useEffect(() => {
    if (entityData) {
      form.reset(entityData);
    }
    setHasError(false);
  }, [entityData, open, entityType]);

  const handleSubmit = async (data: any) => {
    const formData = new FormData();
      const { documents, deleteFiles, ...entityData } = data;
      const dataKey = entityType === 'vendor' ? 'carrierData' : 'CustomerData';
      formData.append(dataKey, JSON.stringify(entityData));

      documents?.forEach((document: any) => {
        if (document.file && document.file instanceof File) {
          formData.append('documents', document.file);
        }
      });

      if (deleteFiles && deleteFiles.length > 0) {
        formData.append("deletedfiles", JSON.stringify(deleteFiles));
      }
    

    mutation.mutate(formData);
  };

  const CompanySection = config.sections.companySection;

  return (
    <AppDialog
      open={!!open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          if (mutation.isPending || hasError) return;
        }
        onClose();
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          boxShadow: theme.shadows[8],
          overflow: 'hidden',
          maxHeight: '90vh'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pl: {xs:2.5, md:3},
        pr: 2,
        py: 0.5,
        bgcolor: '#fff',
        color: '#101721',
        position: 'relative',
        borderBottom:'1px solid #ddd',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {id ? `Update ${config.title}` : `Create New ${config.title}`}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'inherit',
            '&:hover': {
              bgcolor: alpha('#fff', 0.1),
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          {getIcon('CloseIcon')}
        </IconButton>
      </Box>

      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogContent sx={{ px:{xs:1.5, md:2.5}, py:{xs:1.5, md:2.5}, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <ErrorHandlerAlert error={mutation.error} />
            {isFetching  ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
                <CircularProgress size={32} thickness={4} />
              </Box>
            ) : (
              <Grid container spacing={entityType === 'account-customer' || entityType === 'vendor' ? 1.5 : 1.5}>
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 0,
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: entityType === 'account-customer' || entityType === 'vendor' ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      p: 0
                    }}
                  >
                    <CardContent style={{paddingBottom:'16px'}} sx={{ py: 1.5,px:{xs:1.5, md:2}, border: '1px solid #ddd', borderRadius:1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography fontSize={{xs:13, md:14}} sx={{ fontWeight: 600}}>
                          Company Information
                        </Typography>
                      </Box>
                      <CompanySection
                        localUsdot={localUsdot}
                        setLocalUsdot={setLocalUsdot}
                        setOpenDialog={setOpenDialog}
                        open={open}
                        control={form.control as unknown as Control}
                        setValue={form.setValue}
                        watch={form.watch}
                        errors={form.formState.errors}
                        id={id}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {config.sections.additionalSections.map((section, index) => {
                  const shouldShow = section.condition ? section.condition({ withoutUsdot, entityDetails }) : true;
                  console.log(`section.condition:${section.title}`, section.condition && !shouldShow)
                  if (!shouldShow) {
                    return null;
                  }

                  const SectionComponent = (id && section.updateComponent) ? section.updateComponent : section.component;

                  return (
                    <Grid item xs={12} key={index}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 0,
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          border: entityType === 'account-customer' || entityType === 'vendor' ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          p: 0
                        }}
                      >
                        <CardContent style={{paddingBottom:'16px'}} sx={{ py: 1.5,px:{xs:1.5, md:2}, border: '1px solid #ddd', borderRadius:1 }}>
                          {section.title && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: section.title === 'Documents' || section.title === 'Notes And Attachments' || section.title === 'Notes & Attachments' ? 1 : 2 }}>
                            {/* {section.icon} */}
                             <Typography fontSize={{xs:13, md:14}} sx={{ fontWeight: 600,}}>
                              {section.title}
                            </Typography>
                          </Box>}
                          <SectionComponent
                            control={form.control as unknown as Control}
                            setValue={form.setValue}
                            watch={form.watch}
                            errors={form.formState.errors}
                            id={id}
                            customerId={id}
                            setOpenDialog={setOpenDialog}
                            open={open}
                            localUsdot={localUsdot}
                            setLocalUsdot={setLocalUsdot}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 1.7, borderTop: '1px solid #ddd', gap: 0.7 }}>
            <Button
              onClick={onClose}
              disabled={mutation.isPending}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {mutation.isPending ? 'Submitting...' :(id ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>

      <PaymentTermForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        initialData={undefined}
        title={'Add New Payment Term'}
        onSuccess={() => queryClient.refetchQueries({ queryKey: ["paymenterms", "vendors", "customers"] })}
      />
    </AppDialog>
  );
};

export default UniversalEntityForm;
