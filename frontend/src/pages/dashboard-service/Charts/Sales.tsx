import React from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { Paper, Typography, Box, Stack, Chip } from '@mui/material';
import { useAppSelector } from '@/redux/store';
import { formatCurrency, formatDebitCredit } from '@/utils';
import { useSalesStatsQuery } from '@/hooks/useDashboardQueries';
import FilterDate from '../components/FilterDate';
import { Moment } from 'moment';

interface SalesDataItem {
  totalCredit: number;
  totalDebit: number;
  totalAmount: number;
  accountName: string;
  monthName: string;
  ageInMonths: number;
  total: number;
  year: number;
  month: number;
}

interface ChartDataRow {
  date: string;
  month: number;
  year: number;
  [accountKey: string]: number | string;
}

// Fixed categorical palette - each account keeps the same color across every month
const COLORS = [
  '#2a78d6',
  '#1baf7a',
  '#eda100',
  '#4a3aa7',
  '#e34948',
  '#e87ba4',
  '#eb6834',
  '#008300',
];

const toAccountKey = (name: string): string => name.trim().replace(/\s+/g, '_');

const Sales: React.FC = () => {
  const { dashboard } = useAppSelector((state) => state.dashboard);
  const dateFilter = useAppSelector((state) => state.dashboard.dashboard.dateFilters["Sales"]);

  const { isLoading, error } = useSalesStatsQuery(dateFilter.fromDate!, dateFilter.toDate!);

  // Handle both `{ SalesData, TotalSales }` and `{ data: { SalesData, TotalSales } }` shapes
  const salesResponse = (dashboard as any)?.data ?? dashboard;
  const salesData: SalesDataItem[] = salesResponse?.SalesData || [];
  const totalSales = salesResponse?.TotalSales;

  // Account list order is fixed once, so color assignment never shifts between renders
  const uniqueAccounts: string[] = [...new Set(salesData.map((item) => item.accountName.trim()))];

  const monthlySalesData = salesData.reduce<Record<string, ChartDataRow>>((acc, item) => {
    const monthKey = `${item.year}-${item.month}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        date: `${item.monthName} ${item.year}`,
        month: item.month,
        year: item.year,
      };
    }

    const accountKey = toAccountKey(item.accountName);
    const currentValue = (acc[monthKey][accountKey] as number) || 0;
    acc[monthKey][accountKey] = currentValue + Number(item.total);

    return acc;
  }, {});

  const chartData: ChartDataRow[] = Object.values(monthlySalesData).sort((a, b) =>
    a.year === b.year ? a.month - b.month : a.year - b.year
  );

  const formatDateDisplay = () => {
    if (dateFilter.customeDate && dateFilter.fromDate && dateFilter.toDate) {
      return `${(dateFilter.fromDate as Moment).format('MM/DD/YYYY')} - ${(dateFilter.toDate as Moment).format('MM/DD/YYYY')}`;
    } else if (dateFilter.fromDate) {
      return `From ${(dateFilter.fromDate as Moment).format('MM/DD/YYYY')}`;
    }
    return 'No date selected';
  };

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
          SALES
        </Typography>
        <FilterDate type="Sales" />
      </Stack>

      <Box sx={{ mb: 1 }}>
        <Typography variant="h4">
          {formatDebitCredit(totalSales)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Sales
        </Typography>
      </Box>

      <Box sx={{ mb: 0.5 }}>
        <Chip
          label={dateFilter.customeDate ? "Custom Range" : "Preset"}
          size="small"
          color={dateFilter.customeDate ? "primary" : "default"}
          sx={{ mr: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatDateDisplay()}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.length > 0 ? chartData : [{ date: 'No Data', month: 0, year: 0 }]}
            margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
            barGap={4}
            barCategoryGap="30%"
          >
            <CartesianGrid
  strokeDasharray="3 3"
  vertical={false}
  stroke="#cbd5e1"
/>
<XAxis
  dataKey="date"
  axisLine={{ stroke: '#94a3b8' }}
  tickLine={false}
  tick={{ fill: '#64748b', fontSize: 13 }}
  dy={20}
  height={50}
/>
<YAxis
  axisLine={{ stroke: '#94a3b8' }}
  tickLine={false}
  tick={{ fill: '#64748b', fontSize: 13 }}
  tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
/>
            {/* <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 13, }}
              dy={25}
               height={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 13 }}
              tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
            /> */}
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,.08)",
              }}
              formatter={(value: number, name: string) => [
                formatDebitCredit(value),
                name.replace(/_/g, " "),
              ]}
              labelFormatter={(label: string) => label}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px'}}
              formatter={(value: string) => value.replace(/_/g, ' ')}
            />
            {uniqueAccounts.map((account, index) => {
              const key = toAccountKey(account);
              const accountColor = COLORS[index % COLORS.length];

              return (
                <Bar
                  key={key}
                  dataKey={key}
                  name={account}
                  fill={accountColor}
                  isAnimationActive={false}
                  radius={[3, 3, 0, 0]}
                  barSize={28}
                >
                  {chartData.map((entry, i) => (
                    <Cell
                      key={`${key}-${i}`}
                      fill={accountColor}
                      style={{ fill: accountColor }}
                      cursor="pointer"
                      onClick={() => {
                        const value = (entry[key] as number) || 0;
                        console.log({ account, month: entry.date, amount: value });
                      }}
                    />
                  ))}
                  <LabelList
                    dataKey={key}
                    position="top"
                    formatter={(value: number) => (value ? formatDebitCredit(value) : '')}
                    style={{ fontSize: 10, fill: '#64748b', }}
                  />
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export default Sales;