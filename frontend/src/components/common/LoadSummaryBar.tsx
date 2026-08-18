import React from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Tooltip,
  LinearProgress,
  alpha,
} from '@mui/material';
import { formatCurrency } from '@/utils';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';

type Section = {
  totalAmount: number;
  count: number;
  label: string;
  percentage: number;
  color: string;
  gradient?: string;
  icon?: React.ReactNode;
  isCountNeeded?:boolean
};

type Props = {
  sections: Section[];

};

const getIconForLabel = (label: string): React.ReactNode => {
  const l = label.toLowerCase();
  if (l.includes('unbill')) return <AttachMoneyIcon />;
  if (l.includes('overdue')) return <WarningAmberRoundedIcon />;
  if (l.includes('open')) return <HourglassTopRoundedIcon />;
  if (l.includes('partial')) return <SplitscreenIcon />;
  if (l.includes('paid') || l.includes('recently')) return <CheckCircleIcon />;
  return <ReceiptLongIcon />;
};

const getGradient = (color: string): string =>
  `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`;

const LoadSummaryBar: React.FC<Props> = ({ sections}) => {
  return (
    <Grid container spacing={0}>
      {sections.map(({ label, totalAmount, count, color, percentage, gradient, icon,isCountNeeded=true }, index) => {
        const grad = gradient || getGradient(color);
        const iconNode = icon || getIconForLabel(label);
        const tooltipTitle = `${count} record${count !== 1 ? 's' : ''} · ${formatCurrency(totalAmount)} (${percentage.toFixed(1)}%)`;
        return (
          <Grid item xs={12} sm={12} md={12} key={label}>
            <Tooltip title={tooltipTitle} placement="top" arrow>
               <Card
                variant="outlined"
                sx={{
                borderRadius: 0,
                padding:'13px 10px',
                borderBottom:
                index === sections.length - 1
                  ? "none"
                  : "1px solid #ddd",
                bgcolor: '#fff',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                borderTop:'none',
                borderLeft:'none',
                borderRight:'none',
              }}
              >
              {/* Gradient top accent bar */}
                <Box>
                 {/* Icon + count row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start',gap:2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 0.8,
                        bgcolor: alpha(color, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                     {React.isValidElement(iconNode) &&
                     React.cloneElement(iconNode, { sx: { fontSize: 24, color: alpha(color, 1) } } as any)}
                    </Box>

                    <Box sx={{width:'70%'}}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', mb: 0 }} noWrap>
                    {label}
                    </Typography>
                     <Typography sx={{ fontSize: '17px', fontWeight: 700, color:isCountNeeded?'#101721':'transparent' }}>
                    {formatCurrency(totalAmount)}
                    </Typography>
                    </Box>

                    {/* Progress bar */}
                    {/* <Box sx={{width:'100%'}}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(percentage, 100)}
                      sx={{
                        height: 5,
                        borderRadius: 4,
                        bgcolor: '#c4c4c4',
                        '& .MuiLinearProgress-bar': { background: alpha(color, 1), borderRadius: 4 },
                      }}
                    />
                    </Box> */}

                    {/* Records */}
                    <Box sx={{textAlign:'center'}}>
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          p: '3px 7px',
                          fontWeight: 700,
                          borderRadius: 0.5,
                          textAlign: 'center',
                          lineHeight: 1,
                          color: alpha(color, 1),
                          bgcolor: alpha(color, 0.1),
                          marginBottom: '5px !important',
                          margin:'0 auto',
                          width:'fit-content',
                        }}>
                        {count}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'capitalize'}}>
                        records
                      </Typography>
                    </Box>
                  </Box>
                  {/* Label */}
                </Box>
              </Card>
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default LoadSummaryBar;
