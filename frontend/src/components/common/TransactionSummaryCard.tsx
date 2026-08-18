import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { formatCurrency } from '@/utils';
import { ICustomerTransactionDetails } from '@/types';

const TransactionSummaryCard: React.FC<{ data?: ICustomerTransactionDetails }> = ({ data }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 1.5,
        px:{xs:1.5, md:2.5},
        minWidth: 200,
        height: '100%',
        border: '1px solid',
        borderColor: '#ddd',
        borderRadius: 0.5,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        SUMMARY
      </Typography>

      {/* Open Balance */}
      <Box display="flex" alignItems="center" mt={1} mb={1}>
        <Box sx={{ width: 3, height: 40, bgcolor: 'warning.main', borderRadius: 1, mr: 1.5 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {formatCurrency(data?.totalDueAmount || 0).toLocaleString()}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Open balance
          </Typography>
        </Box>
      </Box>

      {/* Overdue Payment */}
      <Box display="flex" alignItems="center">
        <Box sx={{ width: 3, height: 40, bgcolor: 'error.main', borderRadius: 1, mr: 1.5 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {formatCurrency(data?.totalOverDueAmt || 0).toLocaleString()}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Overdue payment
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default TransactionSummaryCard;
