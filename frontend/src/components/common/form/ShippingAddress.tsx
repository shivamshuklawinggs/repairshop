import { Grid, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';

interface ShippingAddressProps {
  showSameAsCheckbox?: boolean;
  checkboxTitle?: string;
  fieldName?: string;
  sourceAddress?: string;
  targetAddress?: string;
}

const ShippingAddress = ({
  showSameAsCheckbox = false,
  checkboxTitle = "Same As Billing Address",
  fieldName = "sameAsBillingAddress",
  sourceAddress = "billingAddress",
  targetAddress = "shippingAddress"
}: ShippingAddressProps) => {
  const form = useFormContext<any>();
  const shippingErrors = (form.formState.errors.shippingAddress as any) || {};
  const sameAsBilling = form.watch(fieldName);

  useEffect(() => {
    if (sameAsBilling) {
      form.setValue(targetAddress, form.watch(sourceAddress));
    }
  }, [sameAsBilling, form, sourceAddress, targetAddress]);

  useEffect(() => {
    if (sameAsBilling) {
      form.setValue(targetAddress, form.watch(sourceAddress));
    }
  }, [form.watch([`${sourceAddress}.address`, `${sourceAddress}.city`, `${sourceAddress}.state`, `${sourceAddress}.zipCode`, `${sourceAddress}.country`]), sameAsBilling, form, sourceAddress, targetAddress]);

  return (
    <Grid container spacing={1.75}>
      {showSameAsCheckbox && (
      <Grid item xs={12} md={12} sx={{paddingTop:'3px !important'}}>
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
                  sx={{
                    pr: 0.6,
                    pl:1.5,
                    '& .MuiSvgIcon-root': {
                        fontSize: 18
                      }
                   }}
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
          name="shippingAddress.address"
          control={form.control}
          render={({ field }) => (
            <TextField
              size="small"
              {...field}
              fullWidth
              multiline
              rows={1}
              InputLabelProps={{ shrink: true }}
              label="Street Address"
              error={!!shippingErrors.address}
              helperText={shippingErrors.address?.message}

            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="shippingAddress.city"
          control={form.control}
          render={({ field }) => (
            <TextField
              size="small"
              {...field}
              fullWidth
              label="City"
              InputLabelProps={{ shrink: true }}
              error={!!shippingErrors.city}
              helperText={shippingErrors.city?.message}

            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="shippingAddress.state"
          control={form.control}
          render={({ field }) => (
            <TextField
              size="small"
              {...field}
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="State"
              error={!!shippingErrors.state}
              helperText={shippingErrors.state?.message}

            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="shippingAddress.zipCode"
          control={form.control}
          render={({ field }) => (
            <TextField
              size="small"
              {...field}
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="Zip Code"
              error={!!shippingErrors.zipCode}
              helperText={shippingErrors.zipCode?.message}

            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="shippingAddress.country"
          control={form.control}
          render={({ field }) => (
            <TextField
              size="small"
              {...field}
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="Country"
              error={!!shippingErrors.country}
              helperText={shippingErrors.country?.message}

            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default ShippingAddress;
