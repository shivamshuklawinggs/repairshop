import React from 'react';
import { Box, Typography, Grid, Paper, Link } from '@mui/material';
import { addressformat, truncateText } from '@/utils';
import { ICustomerTransactionDetails } from '@/types';
import { Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';

const TransactionBasicDetails: React.FC<{ data?: ICustomerTransactionDetails }> = ({ data }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: {xs:1.5, md:2},
        px: {xs:1.5, md:2.5},
        minWidth: 200,
        border: '1px solid',
        borderColor: '#ddd',
        borderRadius: 0.5,
      }}
    >
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle2" fontWeight="600" sx={{ border: '1px solid #ddd', padding: '2px 10px', borderRadius: 0.5 }}>
          {data?.company || 'N/A'}
        </Typography>
        {data?.phone && (
          <Link href={`tel:${data.phone}`}>
            <PhoneIcon sx={{ fontSize: '18px', color: 'text.secondary' }} />
          </Link>
        )}
        {data?.email && (
          <Link href={`mailto:${data.email}`}>
            <EmailIcon sx={{ fontSize: '18px', color: 'text.secondary' }} />
          </Link>
        )}
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="textSecondary">Company</Typography>
          <Typography variant="body2">{data?.company}</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="textSecondary">Billing Address</Typography>
          {data?.billingAddress ? (
            <Typography variant="body2">
              {addressformat({billingAddress:data?.billingAddress})}
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">N/A</Typography>
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
          <Typography variant="body2" color="textSecondary">{data?.paymentMethod || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
          <Typography variant="body2" color="textSecondary">{data?.notes || 'N/A'}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TransactionBasicDetails;
