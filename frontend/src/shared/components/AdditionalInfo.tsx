import React from 'react';
import { Grid, FormControl, InputLabel, MenuItem, Select, FormHelperText, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { ICarrier, ICustomer, IPaymentTerm } from '@/types';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { PaymentMethodsOptions } from '@/types/enum';
import { EntityType } from '@/components/common/UniversalEntityForm';

interface AdditionalInfoProps {
  entity?: EntityType; // 'carrier' or 'customer'
  showPaymentTerms?: boolean;
  showPaymentMethod?: boolean;
  showNotes?: boolean;
  setOpenDialog?: (open: boolean) => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({
  entity = 'carrier',
  showPaymentTerms = false,
  showPaymentMethod = false,
  showNotes = false,
  setOpenDialog
}) => {
  const form = useFormContext<ICarrier | ICustomer>();

  const { data: paymentTerms } = useQuery({
    queryKey: ['paymenterms'],
    queryFn: async () => apiService.getPaymentTerms(),
    enabled: showPaymentTerms
  });

  return (
    <Grid container spacing={1.75}>
      <Grid item xs={12} md={6}>
        <Controller
          name="alternatphone"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              size='small'
              fullWidth
              label={entity === 'customer' ? "Alternate Phone No" : "Alternate Contact"}
              onChange={(e) =>
                field.onChange(e)
              }
              error={!!form.formState.errors.alternatphone}
              helperText={form.formState.errors.alternatphone?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="extentionNo"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              size='small'
              fullWidth
              label="Extension No"
              onChange={(e) => {
                field.onChange(e);
              }}
              error={!!form.formState.errors.extentionNo}
              helperText={form.formState.errors.extentionNo?.message}
            />
          )}
        />
      </Grid>

      {showPaymentMethod && (
        <Grid item xs={12} md={6}>
          <Controller
            name="paymentMethod"
            control={form.control}
            render={({ field }) => (
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  {...field}
                  label="Payment Method"
                  error={!!form.formState.errors.paymentMethod}
                >
                  {PaymentMethodsOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {form.formState.errors.paymentMethod && (
                  <FormHelperText error>
                    {form.formState.errors.paymentMethod?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
      )}

      {showPaymentTerms && (
        <Grid item xs={12} md={6}>
          <Controller
            name="paymentTerms"
            control={form.control}
            render={({ field }) => (
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  {...field}
                  label="Payment Terms"
                  error={!!form.formState.errors.paymentTerms}
                >
                  {Array.isArray(paymentTerms?.data) && paymentTerms?.data?.map((term: IPaymentTerm) => (
                    <MenuItem key={term._id} value={term._id}>
                      {term.name}
                    </MenuItem>
                  ))}
                  <MenuItem
                    onClick={() => setOpenDialog?.(true)}
                    sx={{ color: 'primary.main', fontWeight: 'bold' }}
                  >
                    + Add New Payment Term
                  </MenuItem>
                </Select>
                {form.formState.errors.paymentTerms && (
                  <FormHelperText error>
                    {form.formState.errors.paymentTerms?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
      )}

      {showNotes && (
        <Grid item xs={12}>
          <Controller
            name="notes"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                size='small'
                fullWidth
                multiline
                rows={3}
                label="Notes"
                error={!!form.formState.errors.notes}
                helperText={form.formState.errors.notes?.message}
              />
            )}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default AdditionalInfo;
