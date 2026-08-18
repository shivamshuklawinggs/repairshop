import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Paper, Typography, Box, Stack, Grid } from '@mui/material';
import FilterDate from '../components/FilterDate';

export interface AgingChartDataItem {
  name: string;
  value: number;
  amount: string;
  color: string;
}

interface AgingChartProps {
  title: string;
  filterType: 'AccPayable' | 'AccReceivable';
  totalAmount: string;
  chartLabel: string;
  data: AgingChartDataItem[];
}

const AgingChart: React.FC<AgingChartProps> = ({
  title,
  filterType,
  totalAmount,
  chartLabel,
  data,
}) => {
  // Process data to handle negative values - use absolute values for pie chart
  const processedData = data.map((item) => ({
    ...item,
    value: Math.abs(item.value), // Use absolute value for pie chart display
    originalValue: item.value, // Keep original value for tooltip
  }));
  
  const chartData = processedData.filter((item) => item.value !== 0);
  const isEmpty = chartData.length === 0;
  const displayedData = isEmpty
    ? [{ name: 'No Data', value: 1, amount: '0', color: '#d3d3d3', originalValue: 0 }]
    : chartData;

  const legendItems = data.map((item) => ({
    color: isEmpty ? '#b6b6b6' : item.color,
    amount: item.amount,
    label: item.name,
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0 }}
      >
        <Typography sx={{ fontSize: '0.8rem', fontWeight: '600' }} noWrap>
          {title}
        </Typography>
        <FilterDate type={filterType} />
      </Stack>

      <Typography variant="h4">{totalAmount}</Typography>
      <Typography variant="body2" color="text.secondary">
        Total Amount
      </Typography>

      <Box sx={{ flex: 1, mt: 5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {legendItems.map((item, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '0px',
                      bgcolor: item.color,
                    }}
                  />

                  <Box>
                    <Typography variant="body1" fontWeight={500} lineHeight={0.8}>
                      {item.amount}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} style={{ padding: '0px' }}>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={displayedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={100}
                    paddingAngle={isEmpty ? 0 : 2}
                    cornerRadius={isEmpty ? 0 : 6}
                  >
                    {displayedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '17px',
                      fontWeight: 500,
                      fill: isEmpty ? '#9ca3af' : '#101721',
                    }}
                  >
                    {isEmpty ? 'No Data' : 'Total'}
                  </text>

                  <text
                    x="50%"
                    y="59%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: '14px', fill: '#64748b' }}
                  >
                    {chartLabel}
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
                      const absValue = Math.abs(originalValue);
                      const formattedValue = originalValue < 0 ? `-$${absValue.toLocaleString()}` : `$${absValue.toLocaleString()}`;
                      return [formattedValue, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default AgingChart;
