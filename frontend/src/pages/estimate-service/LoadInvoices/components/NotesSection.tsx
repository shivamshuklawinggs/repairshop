
import { Grid, TextField } from '@mui/material';
import { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { IInvoice } from '@/types';

const NotesSection:FC = () => {
  const form=useFormContext<IInvoice>();
  const invoiceType=form.watch("type")
  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField size='small'
            fullWidth
            label={invoiceType==="carrier"?"Carrier Notes":"Notes"}
            multiline
            rows={2}
            {...form.register('customerNotes')}
            error={!!form.formState.errors.customerNotes}
            helperText={form.formState.errors.customerNotes?.message}
            placeholder="Enter Notes"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField size='small'
            fullWidth
            label={invoiceType==="carrier"?"Carrier Terms and Conditions":"Customer Terms and Conditions"}
            multiline
            rows={2}
            {...form.register('terms_conditions')}
            error={!!form.formState.errors.terms_conditions}
            helperText={form.formState.errors.terms_conditions?.message}
            placeholder="Enter Terms and Conditions"
          />
        </Grid>

      </Grid>
    </Grid>
  );
};

export default NotesSection;