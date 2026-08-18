import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { formatCurrency } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { useParams } from 'react-router-dom';
import api from '@/utils/axiosInterceptor';
import CommonDatePicker from '@/components/common/CommonDatePicker';
import StatCard from '@/components/ui/StatCard';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import BarChartIcon from '@mui/icons-material/BarChart';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

interface MarginReportData {
  _id: null;
  totalLoads: number;
  totalRevenue: number;
  avgMargin: number;
  totalMargin: number;
}

const MarginReport: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const [data, setData] = useState<MarginReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchMarginReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/margin-report/${userId}`, {
        params: {
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
        }
      });
      if (response?.data?.data) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMarginReport();
  }, [userId, filters.startDate, filters.endDate]);

  const handleFilterChange = (e: { target: { name: string; value: string } }) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '' });
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb:{xs:2, md:3}}}>
        <Typography fontWeight={600} fontSize={{ xs: 16, md: 17 }}>
          Margin Report
        </Typography>

        <Typography fontSize={{ xs: 13, md: 14 }} color="text.secondary">
          Track and analyze your margin performance with comprehensive insights into revenue, costs, and profitability.
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          border: '1px solid #e2e8f0',
          borderRadius: 1,
          overflow: 'hidden',
          pl:2,
          pr:2,
          pb:2,
          pt:1.3,
        }}
      >
          <Box>
            <Typography fontSize={14} fontWeight="bold" mb={1}>
              Date Filters
            </Typography>
          </Box>
          <Grid container spacing={{xs:1.5, md:2}} alignItems="center">
            <Grid item xs={12} md={4}>
              <CommonDatePicker
                size='small'
                name="startDate"
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CommonDatePicker
                size='small'
                name="endDate"
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleReset}
                  disabled={loading}
                  sx={{
                    borderRadius: 0.5,
                    px: 3,
                    py: 0.8,
                    width:'100%',
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>

      </Card>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      )}
      {/* Summary Cards */}
      <Grid container spacing={{xs:1.5, md:2}} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Total Loads"
            value={data?.totalLoads ?? 0}
            icon={<LocalShippingIcon />}
            color="#1954d3"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(data?.totalRevenue ?? 0)}
            icon={<TrendingUpIcon />}
            color="#00a2ff"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Total Margin"
            value={formatCurrency(data?.totalMargin ?? 0)}
            icon={<DonutLargeIcon/>}
            color="#9142eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Margin Per Load"
            value={formatCurrency(data?.avgMargin ?? 0)}
            icon={<BarChartIcon />}
            color="#df9400"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Performance"
            value={data?.totalMargin && data.totalMargin >= 0 ? 'Profitable' : 'Loss'}
            icon={data?.totalMargin && data.totalMargin >= 0 ? <RocketLaunchIcon /> : <RocketLaunchIcon />}
            color={data?.totalMargin && data.totalMargin >= 0 ? '#16a34ae6' : '#f83636'}
          />
        </Grid>
      </Grid>


    </Box>
  );
};

export default MarginReport;
