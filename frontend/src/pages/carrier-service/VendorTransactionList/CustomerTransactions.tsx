// Updated CustomerTransactions.tsx
import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, CircularProgress, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { useParams } from 'react-router-dom';
import OutStandingTransactions from './OutStandingTransactions';
import { ICustomerTransactionDetails } from '@/types';
import TransactionBasicDetails from '@/components/common/TransactionBasicDetails';
import TransactionSummaryCard from '@/components/common/TransactionSummaryCard';
import TransactionActions from './TransactionActions';
import TransactionCustomerDetails from '@/components/common/TransactionCustomerDetails';

const VendorTransactions: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<string>('outstandingtransactions');
  const { data, isLoading } = useQuery<ICustomerTransactionDetails, Error>({
    queryKey: ['getCustomerBillDetails', id],
    queryFn: async () => {
      const response = await apiService.getCustomerBillDetails(id as string,);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper
        elevation={0}
         sx={{
          p: 0,
          mb: 2,
          borderRadius: 0,
          backgroundColor: 'transparent',
        }}
      >
        <TransactionActions  data={data!! }/>

        <Box display="flex" gap={1} mt={2} flexDirection={{ xs: 'column', md: 'row' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
           <TransactionBasicDetails data={data} />
          </Grid>
           <Grid item xs={12} md={4}>
           <TransactionSummaryCard data={data} />
          </Grid>
        </Grid>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid',
          borderColor: '#ddd',
          borderRadius: 0.5,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 0,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize:'13px'
          },
           '& .MuiTab-root.Mui-selected': {
                color: '#101721',
              },
          '& .Mui-selected': {
            fontWeight: 600,
            color: '#101721',
          }
        }}
        >
          <Tab label="Transaction List" value="outstandingtransactions" />
          <Tab label="Vendor Detalis" value="customerdetalis" />
        </Tabs>

        <Box sx={{ p: 2, flex: 1, overflow: 'auto', mt:0}}>
          {activeTab === 'outstandingtransactions' && <OutStandingTransactions />}
          {activeTab === 'customerdetalis' && data && <TransactionCustomerDetails data={data} />}
        </Box>
      </Paper>
    </Box>
    </>
  );
};

export default VendorTransactions;