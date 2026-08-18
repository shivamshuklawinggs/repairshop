import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';

interface BillingAddressProps {
  showSameAsCheckbox?: boolean;
  checkboxTitle?: string;
  fieldName?: string;
  sourceAddress?: string;
  targetAddress?: string;
}

const BillingAddress = ({
  showSameAsCheckbox = false,
  checkboxTitle = "Same As Billing Address",
  fieldName = "sameAsBillingAddress",
  sourceAddress = "shippingAddress",
  targetAddress = "billingAddress"
}: BillingAddressProps) => {
  const form = useFormContext<any>();
  const billingErrors = (form.formState.errors.billingAddress as any) || {};
  useEffect(() => {
    if (form.watch(fieldName)) {
      form.setValue(targetAddress, form.watch(sourceAddress));
    }
  }, [form.watch([fieldName]), form, sourceAddress, targetAddress]);

  useEffect(() => {
    if (form.watch(fieldName)) {
      form.setValue(targetAddress, form.watch(sourceAddress));
    }
  }, [form.watch([`${sourceAddress}.address`, `${sourceAddress}.city`, `${sourceAddress}.state`, `${sourceAddress}.zipCode`, `${sourceAddress}.country`]), form, sourceAddress, targetAddress]);
  return (
    <Grid container spacing={1.75}>
      {showSameAsCheckbox && (
         <Grid item xs={12} md={12} style={{paddingTop:'4px'}}>
        <FormControlLabel
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px', fontWeight: 500, color: '#101721' } }}
          control={
            <Controller
              name={fieldName}
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  size="small"
                  checked={field.value}
                  onChange={(e) => {
                    form.setValue(fieldName, e.target.checked);
                    form.trigger(fieldName);
                  }}
                  sx={{ pr: 0.6, pl:1.5, }}
                />
              )}
            />
          }
          label={checkboxTitle}
        />
      </Grid>
      )}
      <Grid item xs={12} md={4}>
        <Controller
          name="billingAddress.address"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              multiline
              fullWidth
              rows={1}
              label="Street Address"
              size="small"
              error={!!billingErrors.address}
              helperText={billingErrors.address?.message}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="billingAddress.city"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              size="small"
              label="City"
              error={!!billingErrors.city}
              helperText={billingErrors.city?.message}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="billingAddress.state"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              size="small"
              fullWidth
              label="State"
              error={!!billingErrors.state}
              helperText={billingErrors.state?.message}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="billingAddress.zipCode"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              size="small"
              fullWidth
              label="Zip Code"
              error={!!billingErrors.zipCode}
              helperText={billingErrors.zipCode?.message}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="billingAddress.country"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              size="small"
              fullWidth
              label="Country"
              error={!!billingErrors.country}
              helperText={billingErrors.country?.message}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default BillingAddress;
