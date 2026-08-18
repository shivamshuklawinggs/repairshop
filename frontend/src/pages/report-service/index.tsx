import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  ListItemIcon
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';

import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

import { withPermission } from '@/hooks/authUtils';
import { allowedreports } from '@/types';
import { reports } from './constant';

import ProfitAndLossByMonth from './ProfitAndLossByMonth';
import TrialBalanceReport from './TrialBalanceReport';
import GeneralLedgerReport from './GeneralLedgerReport';
import AccountsReceiveable from './AccountsReceiveable';
import AccountsRecieveableDetail from './AccountsRecieveableDetail';
import AccountsPayable from './AccountsPayable';
import AccountsPayableDetail from './AccountsPayableDetail';
import ProfitAndLoss from './ProfitAndLoss';
import BalanceSheet from './BalanceSheet';

const ReportIndex = () => {
  const favoriteReports = reports;
  const otherReports = reports.filter(r => !r.favorite);

  const { type } = useParams<{ type: allowedreports }>();

  const reportIcons: Record<string, React.ReactNode> = {
    'profit-and-loss': <TrendingUpOutlinedIcon fontSize="small" />,
    'profit-and-loss-month': <AssessmentOutlinedIcon fontSize="small" />,
    'balance-sheet': <AccountBalanceOutlinedIcon fontSize="small" />,
    'AccountsReceiveable': <ReceiptLongOutlinedIcon fontSize="small" />,
    'AccountsRecieveableDetail': <ReceiptLongOutlinedIcon fontSize="small" />,
    'AccountsPayable': <PaymentsOutlinedIcon fontSize="small" />,
    'AccountsPayableDetail': <PaymentsOutlinedIcon fontSize="small" />,
    'TrialBalanceReport': <BalanceOutlinedIcon fontSize="small" />,
    'GeneralLedgerReport': <MenuBookOutlinedIcon fontSize="small" />,
  };

  if (type === "profit-and-loss") {
    return <ProfitAndLoss />;
  } else if (type === "profit-and-loss-month") {
    return <ProfitAndLossByMonth />;
  } else if (type === "balance-sheet") {
    return <BalanceSheet />;
  } else if (type === "AccountsReceiveable") {
    return <AccountsReceiveable />;
  } else if (type === "AccountsPayable") {
    return <AccountsPayable />;
  } else if (type === "AccountsPayableDetail") {
    return <AccountsPayableDetail />;
  } else if (type === "AccountsRecieveableDetail") {
    return <AccountsRecieveableDetail />;
  } else if (type === "TrialBalanceReport") {
    return <TrialBalanceReport />;
  } else if (type === "GeneralLedgerReport") {
    return <GeneralLedgerReport />;
  }

  const NotFound = () => {
    return (
      <List sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
        Data Not found
      </List>
    );
  };

  return (
    <Box>
      <Typography fontSize={{xs:16, md:17}} fontWeight={600} color="text.primary">
        Reports
      </Typography>

      <Typography fontSize={{xs:13, md:14}} color="text.secondary">
        Monitor performance and activity reports
      </Typography>

      <Paper
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 0.5,
          mt: 2.5
        }}
      >
        {favoriteReports.length > 0 ? (
          favoriteReports.map((report) => (
            <List sx={{ py: 0 }} key={report.name}>
              <ListItem
                component={Link}
                to={`/reports/${report.path}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  py: 1,
                  transition: '0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 28,
                    minHeight: 28,
                    color: '#fff',
                    background:'#383e4b',
                    justifyContent:'center',
                    alignItems:'center',
                    marginRight:{ xs: '10px', md: '13px' },
                    borderRadius:'100%',
                    '& .MuiSvgIcon-root': {
                        fontSize: 17
                    }
                  }}
                >
                  {reportIcons[report.path] || (
                    <AssessmentOutlinedIcon fontSize="small" />
                  )}
                </ListItemIcon>

                <ListItemText
                  primary={report.name}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: { xs: '14.6px', md: '16px' },
                    }
                  }}
                />
              </ListItem>

              <Divider />
            </List>
          ))
        ) : (
          <NotFound />
        )}
      </Paper>
    </Box>
  );
};

export default withPermission("view", ["accounting"])(ReportIndex);