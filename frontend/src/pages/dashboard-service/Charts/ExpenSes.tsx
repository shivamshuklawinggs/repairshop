import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Paper, Typography, Box, Stack, Button, Grid } from '@mui/material';
import { paths } from '@/utils/paths';
import { useAppSelector } from '@/redux/store';
import { formatCurrency, formatDebitCredit } from '@/utils';
import { useExpenseStatsQuery } from '@/hooks/useDashboardQueries';
import FilterDate from '../components/FilterDate';
import { getIcon } from '@/components/common/icons/getIcon';
interface ExpenseData {
  name: string;
  value: number;
  originalValue: number;
  color: string;
}

const ExpenSes: React.FC = () => {
  const { dashboard, } = useAppSelector((state) => state.dashboard);
  const dateFilter = useAppSelector((state) => state.dashboard.dashboard.dateFilters["Expenses"]);
  
  // Use React Query for data fetching while preserving Redux dispatch internally
  const {  isLoading, error } = useExpenseStatsQuery(dateFilter.fromDate!, dateFilter.toDate!);
  // Get expense data from React Query (which internally uses Redux dispatch)
  const expenseData = dashboard?.expenseData || [];
  const expenseTotal = dashboard?.expenseTotal || 0;

  // Transform expense data for pie chart with colors
  const colors = ['#3F51B5', '#FF8A80', '#f59e0b', '#8b5cf6', '#00a870', '#9a46a8', '#1fadc0'];
  const updatedExpensesData: ExpenseData[] = expenseData.slice(0, 6).map((expense, index) => ({
    name: expense.name,
    value: Math.abs(expense.totalAmount), // Use absolute value for pie chart display
    originalValue: expense.totalAmount, // Keep original value for tooltip
    color: colors[index % colors.length]
  }))
  const isEmpty = !updatedExpensesData || updatedExpensesData.length === 0;

  const chartData = isEmpty
    ? [{ name: 'No Data', value: 1, color: '#d3d3d3' }] // 👈 gray placeholder
    : updatedExpensesData;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0 }}
      >

        <Typography sx={{ fontSize: '0.8rem', fontWeight: '600' }} noWrap>
          EXPENSES
        </Typography>
        <FilterDate type="Expenses" />

      </Stack>

      <Box>
        <Typography variant="h4">
          {formatDebitCredit(expenseTotal)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Expenses
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption"
          component="span"
          sx={{
            color: 'text.primary',
            fontWeight: 500
          }}
        >
          {updatedExpensesData.length} Categories
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Tracked
        </Typography>
      </Stack>

      <Box sx={{ mt: 2, flex: 1 }}>
        <Grid container alignItems="start" spacing={2}>

          <Grid item xs={12} md={5}>
            <Box
            >
              {updatedExpensesData.length>0? updatedExpensesData.map((item: ExpenseData, index: number) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.5, mt:3 }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '0px',
                      bgcolor: item.color
                    }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    {item.name}
                  </Typography>
                </Stack>
              )):<Typography color='error' variant='subtitle1'>No Data Found</Typography>}
            </Box>
          </Grid>


          <Grid item xs={12} md={7}>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={100}
                    paddingAngle={isEmpty ? 0 : 2}   // 👈 no gap if empty
                    cornerRadius={isEmpty ? 0 : 6}   // 👈 no rounding if empty
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>

                  {/* Center Text */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '17px',
                      fontWeight: 500,
                      fill: isEmpty ? '#9ca3af' : '#101721'
                    }}
                  >
                    {isEmpty ? 'No Data' : 'Total'}
                  </text>

                  <text
                    x="50%"
                    y="59%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '14px',
                      fill: '#64748b'
                    }}
                  >
                    Expenses
                  </text>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const originalValue = props.payload.originalValue;
                      return [formatDebitCredit(originalValue), name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>


        </Grid>
      </Box>

      {/* <Button
        component={Link}
        to={paths.expenses}
        endIcon={getIcon("arrowForward", { fontSize: "small" })}
        sx={{
          mt: 2,
          textTransform: 'none',
          justifyContent: 'flex-start',
          pl: 0
        }}
      >
        View all spending
      </Button> */}
    </Paper>
  );
};

export default ExpenSes;