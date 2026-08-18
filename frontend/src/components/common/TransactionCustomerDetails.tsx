import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { truncateText } from '@/utils';
import { ICustomerTransactionDetails } from '@/types';

const TransactionCustomerDetails: React.FC<{ data: ICustomerTransactionDetails }> = ({ data }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        minWidth: 200,
        border: '1px solid',
        borderColor: '#ddd',
        borderRadius: 0.5,
      }}
    >
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        {data?.company && (
          <Typography variant="body2" fontWeight="600">{data.company}</Typography>
        )}
      </Box>

      <Grid container spacing={1}>
        {data?.company && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Company</Typography>
            <Typography variant="body2">{data.company}</Typography>
          </Grid>
        )}
        {data?.phone && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
            <Typography variant="body2">{data.phone}</Typography>
          </Grid>
        )}
        {data?.email && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Email</Typography>
            <Typography variant="body2">{data.email}</Typography>
          </Grid>
        )}
        {data?.billingAddress && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Billing Address</Typography>
            <Typography variant="body2">
              {truncateText(data?.billingAddress?.address || '')}{' '}
              {`${data?.billingAddress?.city || ''}, ${data?.billingAddress?.state || ''} ${data?.billingAddress?.zipCode || ''}`}
            </Typography>
          </Grid>
        )}
        {data?.paymentMethod && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
            <Typography variant="body2">{data.paymentMethod}</Typography>
          </Grid>
        )}
        {data.paymentTerms && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Payment Terms</Typography>
            <Typography variant="body2">{data.paymentTerms}</Typography>
          </Grid>
        )}
        {data?.notes && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
            <Typography variant="body2" color="textSecondary">{data.notes}</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default TransactionCustomerDetails;
