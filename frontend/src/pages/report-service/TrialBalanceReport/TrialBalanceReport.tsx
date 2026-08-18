import React from 'react';
import { allowedreports, ITrialBalanceReport } from '@/types';
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
  useTheme
} from '@mui/material';
import { Reporttitle } from "../constant";
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';
import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/utils';
import { paths } from '@/utils/paths';
import ExportButtons from '../ExportButtons';

const TrialBalanceReport: React.FC<{ reportData: ITrialBalanceReport }> = ({ reportData }) => {
  const theme=useTheme()
  const navigate=useNavigate()
  const { type = "TrialBalanceReport" } = useParams<{ type: allowedreports }>();
  const filters = useAppSelector((state) => state.report);
  return (
    <Box sx={{ p:0, maxWidth: '100%', mx: 'auto', mt:3 }}>
      {/* Header */}
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
            {Reporttitle[type]}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            As of {formatDate(filters.fromDate)}
          </Typography>
        </Box>

        <Box>
          {reportData && <ExportButtons reportType={type} reportData={reportData} />}
        </Box>

      </Box>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
              <TableRow sx={{
                bgcolor: 'primary.main',
                '&:hover':
                  { bgcolor: 'primary.main' },
              }}>
              <TableCell sx={{ color: '#fff', fontWeight: 500}}>Account</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 500, textAlign: 'right'}}>Debit</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 500, textAlign: 'right'}}>Credit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(reportData?.result) &&
            reportData.result.length>0?  reportData.result.map((group) => (
                <TableRow key={group._id}>
                <TableCell sx={{ fontWeight: 500 ,cursor:"pointer", fontSize: '14px', whiteSpace:'nowrap'}} onClick={()=>navigate(`${paths.AccountRegister}/${group._id}`)}>{group.name || '-'}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                  {formatCurrency(group?.totalDebits || 0)}
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                  {formatCurrency(group?.totalCredits || 0)}
                </TableCell>
                </TableRow>
            )) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 2, textAlign: "center", color: 'text.secondary', fontSize:'16px' }}>
                    No records found
                  </TableCell>
                </TableRow>
              )}

            {/* Grand Total Row */}
            <TableRow sx={{
              bgcolor: 'primary.main',
              '&:hover':
              { bgcolor: 'primary.main' },
              }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '14px', color:'#fff' }}>Total</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 600, fontSize: '14px', color:'#fff' }}>
                {formatCurrency(reportData?.totals?.totalDebits || 0)}
              </TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 600, fontSize: '14px', color:'#fff' }}>
                {formatCurrency(reportData?.totals?.totalCredits || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>


    </Box>
  );
};

export default TrialBalanceReport;
