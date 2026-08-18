// src/pages/Dashboard.js
import React from 'react';
import { Box, Typography ,Grid} from '@mui/material';
import { HasPermission, withPermission } from '@/hooks/authUtils';
import { useAppSelector } from '@/redux/store';
import { getGreeting } from '@/utils';
import { useInvoicesAndBillsSummaryQuery } from '@/hooks/useDashboardQueries';
import { InvoiceBillStatCard, StatData } from './StatCard';
import Sales from './Charts/Sales';
import ProfitAndLoss from './Charts/ProfitAndLoss';
import AccPayable from './Charts/AccPayable';
import ExpenSes from './Charts/ExpenSes';
import AccRecieveable from './Charts/AccRecieveable';

const Dashboard: React.FC = () => {
     const { dashboard } = useAppSelector((state) => state.dashboard);
     const { user } = useAppSelector((state) => state.user);
    // Use React Query for data fetching while preserving Redux dispatch internally
    const {  isLoading, error } = useInvoicesAndBillsSummaryQuery();
    const summary = dashboard.InvoicesAndBillsSummary || {
      invoices: {
        totalInvoices: { count: 0, totalAmount: 0 },
        paidInvoices: { count: 0, totalAmount: 0 },
        overdueInvoices: { count: 0, totalAmount: 0 },
        openInvoices: { count: 0, totalAmount: 0 },
        invoicePayments: { count: 0, totalAmount: 0 }
      },
      bills: {
        totalBills: { count: 0, totalAmount: 0 },
        paidBills: { count: 0, totalAmount: 0 },
        overdueBills: { count: 0, totalAmount: 0 },
        openBills: { count: 0, totalAmount: 0 },
        billPayments: { count: 0, totalAmount: 0 }
      }
    };

    const invoiceStats: StatData[] = [
      { _id: 'Total Invoices', count: summary.invoices.totalInvoices.count, totalAmount: summary.invoices.totalInvoices.totalAmount, type: 'invoice' },
      { _id: 'Paid Invoices', count: summary.invoices.paidInvoices.count, totalAmount: summary.invoices.paidInvoices.totalAmount, type: 'invoice' },
      { _id: 'Open Invoices', count: summary.invoices.openInvoices.count, totalAmount: summary.invoices.openInvoices.totalAmount, type: 'invoice' },
      { _id: 'Overdue Invoices', count: summary.invoices.overdueInvoices.count, totalAmount: summary.invoices.overdueInvoices.totalAmount, type: 'invoice' },
      { _id: 'Invoice Payments', count: summary.invoices.invoicePayments.count, totalAmount: summary.invoices.invoicePayments.totalAmount, type: 'invoice' },
    ];

    const billStats: StatData[] = [
      { _id: 'Total Bills', count: summary.bills.totalBills.count, totalAmount: summary.bills.totalBills.totalAmount, type: 'bill' },
      { _id: 'Paid Bills', count: summary.bills.paidBills.count, totalAmount: summary.bills.paidBills.totalAmount, type: 'bill' },
      { _id: 'Open Bills', count: summary.bills.openBills.count, totalAmount: summary.bills.openBills.totalAmount, type: 'bill' },
      { _id: 'Overdue Bills', count: summary.bills.overdueBills.count, totalAmount: summary.bills.overdueBills.totalAmount, type: 'bill' },
      { _id: 'Bill Payments', count: summary.bills.billPayments.count, totalAmount: summary.bills.billPayments.totalAmount, type: 'bill' },
    ];
  
  return (
    <Box sx={{ minHeight: '100vh', pb: 5 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
        <Box>
          <Typography fontWeight={600} fontSize={{ xs: 16, md: 17}} sx={{display:'flex', alignItems:'center', gap:0.5}}>
            {getGreeting(user?.role)} <img src="/hifi.png" alt="hi.." width={24}/>
          </Typography>
          <Typography fontSize={{ xs: 13, md: 14 }} color="text.secondary">
            Overview of your freight operations
          </Typography>
        </Box>
      </Box>
       {/* Total Invoices Row */}
        <Grid container mb={3} spacing={1.5}>
          <Grid item xs={12} sm={12} md={12}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, textTransform:'uppercase',}}>
              Total Invoices
            </Typography>
          </Grid>
            {invoiceStats.map((item) => (
              <Grid item xs={12} sm={12} md={2.4} key={item._id}>
                <InvoiceBillStatCard item={item} stats={invoiceStats} />
              </Grid>
            ))}
        </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5} sx={{ mb:3}}>
         <Grid item xs={12} md={6}>
          <Sales />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProfitAndLoss />
        </Grid>
      </Grid>

       {/* Total Bills Row */}
        <Grid container sx={{ mb:3}} spacing={1.5}>
          <Grid item xs={12} sm={12} md={12}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, textTransform:'uppercase',}}>
             Total Bills
            </Typography>
          </Grid>
            {billStats.map((item) => (
              <Grid item xs={12} sm={12} md={2.4} key={item._id}>
                <InvoiceBillStatCard item={item} stats={billStats} />
              </Grid>
            ))}
        </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={4}>
          <AccRecieveable/>
        </Grid>
        <Grid item xs={12} md={4}>
          <ExpenSes />
        </Grid>
        {/* <Grid item xs={12} md={4}>
          <AccRecieveable />
        </Grid> */}
        <Grid item xs={12} md={4}>
          <AccPayable />
        </Grid>
      </Grid>
    </Box>
  );
};

export default withPermission("view", ["dashboard"])(Dashboard);
