import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box,  CircularProgress } from '@mui/material';
import apiService from '@/service/apiService';
import { CustomerDashboardData } from '@/types';
import StyledSummaryBar from '@/components/common/StyledSummaryBar';

const CustomerDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      const response: CustomerDashboardData = await apiService.Dashboard.getVendorDashboard();
      return response.data;
    },
  });

  if (isLoading || !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  return  (
    <StyledSummaryBar
  sections={[
    { label: 'Overdue bills',           totalAmount: data?.overdueInvoices?.totalAmount   || 0, count: data?.overdueInvoices?.count   || 0, color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)', percentage: data?.overdueInvoices?.percentage   || 0 },
    { label: 'Open bills and credits',  totalAmount: data?.open?.totalAmount              || 0, count: data?.open?.count              || 0, color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', percentage: data?.open?.percentage              || 0 },
    { label: 'Partial bills',           totalAmount: data?.partialInvoices?.totalAmount   || 0, count: data?.partialInvoices?.count   || 0, color: '#d97706', gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', percentage: data?.partialInvoices?.percentage   || 0 },
    { label: 'Recently paid',           totalAmount: data?.recentPaidInvoices?.totalAmount || 0, count: data?.recentPaidInvoices?.count || 0, color: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)', percentage: data?.recentPaidInvoices?.percentage || 0 },
  ]}
/>
)
};

export default CustomerDashboard;
