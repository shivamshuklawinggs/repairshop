import { FC } from 'react';
import { Grid, TextField, FormControl, FormHelperText } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { IVendorBill } from '@/types';
import CustomerSelect from './CustomerSelect';
import { useLoadStatusCheck } from '@/hooks/useLoadStatusCheck';

interface HeaderSectionProps {
  initialData: IVendorBill | null,
  openCustomerModal:()=>void
}
const HeaderSection: FC<HeaderSectionProps> = ({ initialData,openCustomerModal }) => {
  const form = useFormContext<IVendorBill>()
  const billNumber = useWatch({ control: form.control, name: 'BillNumber' });
  
  const { isAvailable, isLoading, loadStatusError:InvoiceError } = useLoadStatusCheck({
    documentNumber: billNumber,
    documentType: 'bill',
    initialData,
    apiMethod: 'checkAccountBillNumberExist'
  });
 
  console.log("form.errors",form.formState.errors)
  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        {/* Bill Number */}
        <Grid item xs={12} md={4}>
          <FormControl size='small' fullWidth error={!!form.formState.errors.BillNumber}>
            <TextField size='small'
              fullWidth
              label="Bill Number"
              {...form.register('BillNumber')}
              value={billNumber || ""}
              error={!!form.formState.errors.BillNumber || Boolean(billNumber) && !isAvailable}
              helperText={
                isLoading
                  ? "Checking availability..."
                  : form.formState.errors.BillNumber?.message ||
                  InvoiceError ||
                  (Boolean(billNumber) && !isAvailable ? "Bill Number Already Exists" :Boolean(billNumber) && "Bill Number is Available")
              }
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: !!initialData?._id,
              }}
            />
          </FormControl>
        </Grid>
        {/* Vendor Name */}
        <Grid item xs={12} md={4}>
           <CustomerSelect openCustomerModal={openCustomerModal} /> 
        </Grid>

        <Grid item xs={12} md={12}>
          <FormControl size='small' fullWidth error={!!form.formState.errors.address}>
            <TextField size='small'
              fullWidth
              label="Billing Address"
              multiline
              rows={2.5}
              error={!!form.formState.errors.address}
              {...form.register('address')}
              placeholder="Enter billing address"
              InputLabelProps={{ shrink: true }}
            />
            {form.formState.errors.address && (
              <FormHelperText error={!!form.formState.errors.address}>{form?.formState?.errors?.address?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default HeaderSection;
