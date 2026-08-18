
import { useTheme, Typography, Box, Card, alpha, Grid, LinearProgress, Tooltip } from '@mui/material';
import React from 'react';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/utils';
import { useInvoicesAndBillsSummaryQuery } from '@/hooks/useDashboardQueries';
import { withPermission } from '@/hooks/authUtils';
export interface StatData {
  _id: string;
  count: number;
  totalAmount: number;
  type: 'invoice' | 'bill';
}

export const IB_STAT_CONFIG: Record<string, { color: string; gradient: string; label: string }> = {
  'Total Invoices': { color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)', label: 'Total' },
  'Paid Invoices': { color: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #16a34a 100%)', label: 'Paid' },
  'Open Invoices': { color: '#d97706', gradient: 'linear-gradient(135deg, #d97706 0%, #d97706 100%)', label: 'Open' },
  'Overdue Invoices': { color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #dc2626 100%)', label: 'Overdue' },
  'Invoice Payments': { color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #7c3aed 100%)', label: 'Payments' },
  'Total Bills': { color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)', label: 'Total' },
  'Paid Bills': { color: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #16a34a 100%)', label: 'Paid' },
  'Open Bills': { color: '#d97706', gradient: 'linear-gradient(135deg, #d97706 0%, #d97706 100%)', label: 'Open' },
  'Overdue Bills': { color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #dc2626 100%)', label: 'Overdue' },
  'Bill Payments': { color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #7c3aed 100%)', label: 'Payments' },
};

const getIcon = (id: string) => {
  if (id.includes('Total')) return id.includes('Invoice') ? <ReceiptIcon /> : <DescriptionIcon />;
  if (id.includes('Paid')) return <CheckCircleIcon />;
  if (id.includes('Open')) return <HourglassTopRoundedIcon />;
  if (id.includes('Overdue')) return <WarningAmberRoundedIcon />;
  if (id.includes('Payments')) return <AccountBalanceWalletIcon />;
  return <ReceiptLongIcon />;
};

const getProgressValue = (item: StatData, stats: StatData[]) => {
  const total = stats.find((s) => s._id.includes('Total'));
  if (!total || total.totalAmount === 0) return 0;
  return Math.min((item.totalAmount / total.totalAmount) * 100, 100);
};

export const InvoiceBillStatCard = ({ item, stats }: { item: StatData; stats: StatData[] }) => {
  const cfg = IB_STAT_CONFIG[item._id]
  const { color, gradient, label } = cfg;
  const progress = getProgressValue(item, stats);

  return (
    <Tooltip title={`${item.count} records · ${formatCurrency(item.totalAmount)}`} placement="top" arrow>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 1,
          //border: `1px solid ${alpha(color, 0.18)}`,
          bgcolor: '#fff',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          //cursor: 'default',
          // '&:hover': {
          //   borderColor: alpha(color, 0.55),
          //   boxShadow: `0 6px 24px ${alpha(color, 0.18)}`,
          //   transform: 'translateY(-3px)',
          // },
        }}
      >
        {/* Gradient top bar */}
        {/* <Box sx={{ height: 4, background: gradient }} /> */}

        <Box sx={{ p: '13px 15px 15px 15px' }}>
          {/* Icon + count row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0, gap: 2 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 100,
                bgcolor: alpha(color, 0.9),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                //boxShadow: `0 4px 10px ${alpha(color, 0.3)}`,
              }}
            >
              {React.cloneElement(getIcon(item._id), { sx: { fontSize: 24, color: '#fff' } })}
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', mb: 0}}>
                {item._id}
              </Typography>

              {/* Amount */}
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#101721', mb:0.2 }}>
                {formatCurrency(item.totalAmount)}
              </Typography>

              <Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>
               <Typography
                sx={{
                  fontSize: '0.875rem',
                  //p: '3px 10px',
                  fontWeight: 700,
                  borderRadius: 0.5,
                  textAlign: 'center',
                  lineHeight: 1,
                  color: alpha(color, 1),
                  //bgcolor: alpha(color, 0.1),
                  mb: 0,
                  width: 'fit-content',
                }}>
                {item.count}
               </Typography>
               <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary',}}>
                records
               </Typography>
            </Box>
            </Box>
            </Box>

            {/* Progress bar */}
              <Box sx={{ mt:1}}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 5,
                    borderRadius: 5,
                    bgcolor: '#c4c4c4',
                    '& .MuiLinearProgress-bar': { background: gradient, borderRadius: 4 },
                  }}
                />
              </Box>
          {/* Label */}
        </Box>
      </Card>
    </Tooltip>
  );
};