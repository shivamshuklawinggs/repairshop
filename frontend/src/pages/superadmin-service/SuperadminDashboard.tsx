import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  alpha,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchBusinessAnalytics } from '@/redux/api';
import { formatCurrency } from '@/utils';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (

  <Card elevation={0}
    sx={{
      height: '100%',
      borderRadius: 1,
      background:'#fff',
      border:'1px solid #ddd',
    }}>
    <CardContent sx={{ p:'15px 17px 15px 17px !important' }}>
      <Box display="flex" alignItems="start" gap={2}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 4,
            bgcolor: alpha(color, 1),
            display: 'flex',
            alignItems: 'center',
            color: '#fff',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography gutterBottom fontSize={14} color='text.secondary' fontWeight={600} mb={0}>
          {title}
          </Typography>
          <Typography variant="h5" component="div">
          {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {subtitle && (
          <Typography fontSize={13} color='text.primary'>
          {subtitle}
          </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const getPerformanceIcon = (status: string) => {
  switch (status) {
    case 'growth':
      return <TrendingUpIcon sx={{ fontSize: 18 }} />;
    case 'loss':
      return <TrendingDownIcon sx={{ fontSize: 18 }} />;
    default:
      return <TrendingFlatIcon sx={{ fontSize: 18 }} />;
  }
};

const getPerformanceColor = (status: string) => {
  switch (status) {
    case 'growth':
      return 'success';
    case 'loss':
      return 'error';
    default:
      return 'warning';
  }
};

const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1',
  purple: '#9c27b0',
  teal: '#009688',
  orange: '#ff9800',
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d0ed57'];

const SuperadminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, pagination, loading, error } = useSelector((state: RootState) => state.superadmin);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchBusinessAnalytics({ page: page + 1, limit: rowsPerPage }));
  }, [dispatch, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!analytics) {
    return null;
  }

  return (

    <>
      <Box sx={{ mb:3}}>
        <Typography fontWeight={600} fontSize={17}>
          Logistics Control Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time insights into your freight and logistics network
        </Typography>
      </Box>
      <Box>
        {/* Performance Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.5}>
            <StatCard
              title="Total Revenue (90d)"
              value={formatCurrency(analytics.performanceSummary.totalRevenue)}
              icon={<AssessmentIcon />}
              color="#0072cf"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <StatCard
              title="Growing Admins"
              value={analytics.performanceSummary.growth}
              icon={<TrendingUpIcon />}
              color="#18a33b"
              subtitle="10%+ growth rate"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <StatCard
              title="Stable Admins"
              value={analytics.performanceSummary.stable}
              icon={<TrendingFlatIcon />}
              color="#df9400"
              subtitle="-5% to 10% growth"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <StatCard
              title="Declining Admins"
              value={analytics.performanceSummary.loss}
              icon={<TrendingDownIcon />}
              color="#f83636"
              subtitle="Below -5% growth"
            />
          </Grid>

        </Grid>

        <Grid container spacing={3}>
          {/* User Growth Trend */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1.8}>
              {/* <BusinessIcon color="primary" /> */}
              <Typography fontSize={14.6} fontWeight="600" color='text.primary'>
                User Registration Trend (Last 12 Months)
              </Typography>
            </Box>
            <Box sx={{ mt: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {analytics.userGrowthTrend.map((trend, index) => {
                const colors = [
                  {
                    bg: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
                    border: '#7dd3fc',
                    text: '#0369a1',
                  },
                  {
                    bg: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
                    border: '#f9a8d4',
                    text: '#be185d',
                  },
                  {
                    bg: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
                    border: '#86efac',
                    text: '#15803d',
                  },
                  {
                    bg: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                    border: '#fcd34d',
                    text: '#b45309',
                  },
                  {
                    bg: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '#c4b5fd',
                    text: '#6d28d9',
                  },
                  {
                    bg: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
                    border: '#fca5a5',
                    text: '#b91c1c',
                  },
                ];

                const color = colors[index % colors.length];

                return (
                  <Box
                    key={trend.month}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: color.border,
                      borderRadius: 0.8,
                      minWidth: 90,
                      textAlign: 'center',
                      background: color.bg,
                      transition: '0.3s',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{ color: color.text }}
                    >
                      {trend.count}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: color.text,
                        opacity: 0.8,
                        fontWeight: 500,
                        letterSpacing: 0.5,
                      }}
                    >
                      {trend.month}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          {/* Top Performing Companies */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 0.5,
                border: '1px solid rgb(226, 232, 240)',
              }}
            >
               <Box display="flex" alignItems="center" gap={1} pl={2} pt={1.2} pb={1.2} pr={2}>
              {/* <BusinessIcon color="primary" /> */}
              <Typography fontSize={{xs:13, md:14}} fontWeight="600" color='text.primary'>
                Top 10 Admins by Revenue
              </Typography>
            </Box>
              <CardContent sx={{padding:'0px 0px 5px 0px !important'}}>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Admin</strong></TableCell>
                        <TableCell><strong>Country</strong></TableCell>
                        <TableCell className='tellipsis'><strong>Revenue (90d)</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.topAdmins.map((admin) => (
                        <TableRow key={admin.adminId}
                          sx={{
                            '&:last-child td, &:last-child th': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: '1.1' }}>
                              {admin.adminName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {admin.adminEmail}
                            </Typography>
                          </TableCell>
                          <TableCell>{admin.country}</TableCell>
                          <TableCell>
                            {formatCurrency(admin.revenue)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              //icon={getPerformanceIcon(admin.status)}
                              label={admin.status}
                              color={getPerformanceColor(admin.status) as any}
                              sx={{
                                fontWeight: 500,
                                py: 0.1,
                                fontSize: '12px',
                                height: 'auto',
                                px: 0,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Users by Country */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 0.5,
                border: '1px solid rgb(226, 232, 240)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} pl={2} pt={1.2} pb={1.2} pr={2} sx={{justifyContent:'space-between'}}>
              {/* <PublicIcon color="primary" /> */}
              <Typography fontSize={{xs:13, md:14}} fontWeight="600" color='text.primary'>
                User Distribution by Country
              </Typography>
              <Box>
                {analytics.totalCountries > 0 && (
                  <Chip
                    label={`Showing top 10 of ${analytics.totalCountries} countries`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ px: 0.2, fontSize: '12px', height: 'auto', background:'#fff' }}
                  />
                )}
              </Box>
            </Box>
              <CardContent sx={{ padding: '0px 0px 5px 0px !important' }}>
                {/* <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} mt={1} ml={1}>
                  {analytics.totalCountries > 0 && (
                    <Chip
                      label={`Showing top 10 of ${analytics.totalCountries} countries`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{px:0.2, fontSize:'12px', height:'auto'}}
                    />
                  )}
                </Box> */}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Country</strong></TableCell>
                        <TableCell><strong>Users</strong></TableCell>
                        <TableCell><strong>Admins</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.usersByCountry.map((country) => (
                        <TableRow key={country._id}
                        sx={{
                            '&:last-child td, &:last-child th': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <TableCell>{country._id}</TableCell>
                          <TableCell>{country.totalUsers.toLocaleString()}</TableCell>
                          <TableCell>{country.totalAdmins.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* All Companies Performance */}
          <Grid item xs={12} sx={{pb:5}}>
            <Card
              sx={{
                borderRadius: 0.5,
                border: '1px solid rgb(226, 232, 240)',
              }}
            >
               <Box display="flex" alignItems="center" gap={1} pl={2} pt={1.2} pb={1.2} pr={2}>
              {/* <BusinessIcon color="primary" /> */}
              <Typography fontSize={{xs:13, md:14}} fontWeight="600" color='text.primary'>
                All Admin Performance Analysis
              </Typography>
            </Box>

              <CardContent sx={{ padding: '0px 0px 5px 0px !important' }}>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Admin</strong></TableCell>
                        <TableCell><strong>Country</strong></TableCell>
                        <TableCell className='tellipsis'><strong>Current Revenue</strong></TableCell>
                        <TableCell className='tellipsis'><strong>Previous Revenue</strong></TableCell>
                        <TableCell className='tellipsis'><strong>Growth Rate</strong></TableCell>
                        <TableCell className='tellipsis'><strong>90d Revenue</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.adminPerformance.map((admin) => (
                        <TableRow key={admin.adminId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: '1.1' }}>
                              {admin.adminName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {admin.adminEmail}
                            </Typography>
                          </TableCell>
                          <TableCell>{admin.country}</TableCell>
                          <TableCell>
                            {formatCurrency(admin.currentRevenue)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(admin.previousRevenue)}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={admin.growthRate >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {admin.growthRate >= 0 ? '+' : ''}{admin.growthRate.toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(admin.totalRevenue90Days)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              //icon={getPerformanceIcon(admin.performanceStatus)}
                              label={admin.performanceStatus}
                              color={getPerformanceColor(admin.performanceStatus) as any}
                              sx={{
                                fontWeight: 500,
                                py: 0.1,
                                fontSize: '12px',
                                height: 'auto',
                                px: 0,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {pagination && (
                  <TablePagination
                    component="div"
                    count={pagination.total}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};


export default SuperadminDashboard;
