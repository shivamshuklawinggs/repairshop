import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Collapse,
  IconButton
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { allowedreports, IGeneralLedgerReport } from '@/types';
import { formatCurrency} from '@/utils'
import { formatDate } from '@/utils/dateUtils';
import { useAppSelector } from '@/redux/store';
import { paths } from '@/utils/paths';
import { useNavigate, useParams } from 'react-router-dom';
import ViewButton from '@/components/ui/ViewButton';
import ExportButtons from '../ExportButtons';


const DatewiseGeneralLedgerReport: React.FC<{ reportData: IGeneralLedgerReport }> = ({ reportData }) => {
      const {type="GeneralLedgerReport"}=useParams<{type:allowedreports}>()
  const navigate=useNavigate()
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const filters = useAppSelector((state) => state.report);
  // Expand first payment of each account by default
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    reportData.result.forEach((acc) => {
      if (acc.payments && acc.payments.length > 0) {
        initialExpanded[acc._id] = true;
      }
    });
    setExpandedAccounts(initialExpanded);
  }, [reportData.result]);

  const toggleAccount = (id: string) => {
    setExpandedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box sx={{ p:0, maxWidth: '100%', mx: 'auto', mt:3 }}>
      <Box
        sx={{
          display:{xs:'block', md:'flex'},
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box>
          <Typography fontSize={{xs:16, md:17}} fontWeight={600}>
           General Ledger Report
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {formatDate(filters.fromDate)} - {formatDate(filters.toDate)}
          </Typography>
        </Box>

        <Box>
          {reportData && <ExportButtons reportType={type} reportData={reportData} />}
        </Box>

      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
             <TableRow sx={{
              bgcolor: 'primary.main',
              '&:hover':
              { bgcolor: 'primary.main' },
              }}>
              <TableCell sx={{ fontWeight: 500, fontSize: '14px', color:'#fff' }}>Account</TableCell>
              <TableCell align='right' sx={{ fontWeight: 500, fontSize: '14px', color:'#fff' }}>Action</TableCell>
              <TableCell align='right' sx={{ fontWeight: 500, fontSize: '14px', color:'#fff' }}>Debit</TableCell>
              <TableCell align='right' sx={{ fontWeight: 500, fontSize: '14px', color:'#fff' }}>Credit</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reportData?.result?.length > 0 ? reportData?.result?.map((account, accIdx) => (
              <React.Fragment key={account._id}>
                {/* Account Header */}
                <TableRow
                 sx={{
                    '& > *': { borderBottom: 'none' },
                    bgcolor: '#fff',
                    '&:hover': { bgcolor: '#fff' },
                    cursor: 'pointer'
                }}
                 onClick={() => toggleAccount(account._id)}
                >
                  <TableCell sx={{p:0}}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <IconButton aria-label="expand row" size="small" style={{padding:'0px 0px 0px 10px'}} sx={{ color: 'primary.main'}}>
                      {expandedAccounts[account._id] ? <KeyboardArrowUp style={{verticalAlign:'middle', fontSize:'18px'}}/> : <KeyboardArrowDown style={{verticalAlign:'middle', fontSize:'18px'}}/>}
                    </IconButton>
                    <Typography  fontSize={{ xs: 13, md: 14 }} sx={{ fontWeight: 600, whiteSpace:'nowrap'}}>
                      {account.name}
                    </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align='right' >
                    <ViewButton  onClick={()=>navigate(`${paths.AccountRegister}/${account._id}`)}/>
                  </TableCell>
                  <TableCell align='right' sx={{ fontWeight: 600 }}>
                    {formatCurrency(account?.totalDebits || 0)}
                  </TableCell>
                  <TableCell align='right' sx={{ fontWeight: 600 }}>
                    {formatCurrency(account?.totalCredits || 0)}
                  </TableCell>
                </TableRow>

                {/* Payments Detail */}

                 {account?.payments?.length > 0 && account?.payments?.map((payment, idx) => (
                        <TableRow
                        key={payment.id}
                        sx={{
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
                        opacity: expandedAccounts[account._id] ? 1 : 0,
                        transform: expandedAccounts[account._id] ? 'translateY(0)' : 'translateY(-8px)',
                        visibility: expandedAccounts[account._id] ? 'visible' : 'collapse'
                        }}>
                        {/* <TableCell></TableCell> */}
                        <TableCell sx={{pl:3.4}}>{payment.date?formatDate(payment.date):"-"}</TableCell>
                        <TableCell></TableCell>
                        <TableCell align='right'>
                        {formatCurrency(payment.debit)}
                        </TableCell>
                        <TableCell align='right'>
                        {formatCurrency(payment.credit)}
                        </TableCell>

                        </TableRow>

                   ))}
              </React.Fragment>
            )) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 2, textAlign: "center", color: 'text.secondary', fontSize:'16px' }}>
                    No records found
                  </TableCell>
                </TableRow>
              )}

            {/* Grand Total */}
            <TableRow sx={{
              bgcolor: 'primary.main',
              '&:hover':
              { bgcolor: 'primary.main' },
              }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '15px', color:'#fff' }}>Total</TableCell>
              <TableCell></TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px', color:'#fff' }}>
                {formatCurrency(reportData?.totals?.totalDebits || 0)}
              </TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px', color:'#fff' }}>
                {formatCurrency(reportData?.totals?.totalCredits || 0)}
              </TableCell>

            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      {/* Footer */}
      {/* <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(filters.fromDate)} - {formatDate(filters.toDate)}
        </Typography>
      </Box> */}
    </Box>
  );
};

export default DatewiseGeneralLedgerReport;
