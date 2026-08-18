import React from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Paper, Typography, Box, Stack, Button } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { paths } from '@/utils/paths';
import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/utils';
import { useProfitAndLossQuery } from '@/hooks/useDashboardQueries';
import FilterDate from '../components/FilterDate';
import { getIcon } from '@/components/common/icons/getIcon';

ChartJS.defaults.font.family = "'Inter', sans-serif";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    borderDash?: number[];
  }[];
}

const ProfitAndLoss: React.FC = () => {
  const { dashboard } = useAppSelector((state) => state.dashboard);
  const dateFilter = useAppSelector((state) => state.dashboard.dashboard.dateFilters["Profit&Loss"])

  // Use React Query for data fetching while preserving Redux dispatch internally
  const {  isLoading, error } = useProfitAndLossQuery(dateFilter.fromDate!, dateFilter.toDate!);

  // Process Profit and Loss data from React Query (which internally uses Redux dispatch)
  const profitAndLossData = dashboard?.ProfitAndLossData || [];
  const profitAndLossTotals = dashboard?.ProfitAndLossTotals;

  // Group data by month for chart
  const monthlyData = profitAndLossData.reduce((acc: any, item: any) => {
    const monthKey = `${item.monthName} ${item.year}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, income: 0, expenses: 0 };
    }
    if (item.type === "income") { // Income type
      acc[monthKey].income += item.totalAmount;
    } else if (item.type === "expense") { // Expense type
      acc[monthKey].expenses += item.totalAmount;
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyData).sort((a: any, b: any) => {
    // Sort by date chronologically
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  const incomeData = sortedMonths.map(month => monthlyData[month].income);
  const expensesData = sortedMonths.map(month => monthlyData[month].expenses);

  const data: ChartData = {
    labels: sortedMonths.length > 0 ? sortedMonths : ['No Data'],
    datasets: [
      {
        label: 'Income (Profit)',
        data: incomeData.length > 0 ? incomeData : [0],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: expensesData.length > 0 ? expensesData : [0],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      },
    ]
  };


  const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 600        // 🔹 legend font size
          },
          color: '#64748b',   // 🔹 legend text color
          boxWidth: 10,
          boxHeight: 10,
          padding: 15
        }
      },

      title: {
        display: false,
        text: 'Profit and Loss Chart',
        font: {
          size: 17,          // 🔹 title font size
          weight: 600,
        },
        color: '#101721',
        padding: {
          top: 0,     // 👈 space above title
          bottom: 0   // 👈 space below title
        }
      },

      tooltip: {
        titleFont: {
          size: 14,
          weight: 500
        },
        bodyFont: {
          size: 12
        }
      }
    },

    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            weight: 500        // 🔹 X-axis label font
          },
          color: '#101721'
        },
        grid: {
          color: '#eee'     // 🔹 grid line color
        }
      },
      y: {
        ticks: {
          font: {
            size: 14,
            weight: 500        // 🔹 Y-axis label font
          },
          color: '#101721'
        },
        grid: {
          color: '#eee'
        }
      }
    },

    elements: {
      line: {
        tension: 0.4,       // 🔹 smooth curve
        borderWidth: 1.5,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
        backgroundColor: '#3d66f0'
      }
    }
  };

  const netProfit = profitAndLossTotals?.netProfit || 0;
  const isLoss = netProfit < 0;

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
          PROFIT AND LOSS
        </Typography>

        <FilterDate type="Profit&Loss" />

      </Stack>

      <Box>
        <Typography
          variant="h4"
          sx={{
            mb: 0,
            color: isLoss ? 'error.main' : 'text.primary'
          }}
        >
          {formatCurrency(profitAndLossTotals?.netProfit || 0)}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0 }}
        >
          {isLoss ? 'Net Loss' : 'Net Profit'}
        </Typography>
      </Box>

      <Box
        sx={{
          maxWidth: '100%',
          height: 350,
          position: 'relative',
          display: 'block'
        }}
      >
        <Line data={data} options={options} />
      </Box>

      {/* <Button
        component={Link}
        to={paths.reportprofitandloss}
        endIcon={getIcon("arrowForward", { fontSize: "small" })}
        sx={{
          mt: 2,
          textTransform: 'none',
          justifyContent: 'flex-start',
          pl: 0
        }}
      >
        See profit and loss report
      </Button> */}
    </Paper>
  );
};

export default ProfitAndLoss;