import React from 'react'
import { allowedreports } from '@/types'
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
  IconButton,
  useTheme
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Reporttitle, bucketLabels } from "@/pages/report-service/constant";
import { useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '@/utils'
import { formatDate } from '@/utils/dateUtils';
import { useAppSelector } from '@/redux/store';
import ExportButtons from '@/pages/report-service/ExportButtons';

interface SharedAgingDetailCardProps {
  reportData: any;
  transactionType: 'Bill' | 'Invoice';
  navigationPath: (invoiceId: string) => string;
  type?: allowedreports;
}

const SharedAgingDetailCard: React.FC<SharedAgingDetailCardProps> = ({ reportData, transactionType, navigationPath, type }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [expandedBuckets, setExpandedBuckets] = React.useState<Record<string, boolean>>({})
  const filters = useAppSelector((state) => state.report);
  const { type: routeType } = useParams<{ type: allowedreports }>();
  const displayType = routeType || type;

  const toggleBucket = (bucket: string) => {
    setExpandedBuckets((prev) => ({
      ...prev,
      [bucket]: !prev[bucket]
    }))
  }

  return (
    <Box sx={{ p: 0, maxWidth: '100%', mx: 'auto', mt: 3 }}>
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
            {displayType ? Reporttitle[displayType] : ''}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {formatDate(filters.fromDate)} - {formatDate(filters.toDate)}
          </Typography>
        </Box>

        <Box>
          {reportData && displayType && <ExportButtons reportType={displayType} reportData={reportData} />}
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
                <TableCell sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', width: '30px', px: 0 }}></TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', pl: 0, whiteSpace:'nowrap' }}>Date</TableCell>
                <TableCell align='center' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Transaction Type</TableCell>
                <TableCell align='center' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Num</TableCell>
                <TableCell align='center' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>{transactionType === 'Bill' ? 'Vendor Display Name' : 'Customer Display Name'}</TableCell>
                <TableCell align='center' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Due Date</TableCell>
                <TableCell align='center' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Past Due</TableCell>
                <TableCell align='right' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Amount</TableCell>
                <TableCell align='right' sx={{ fontWeight: 500, fontSize: '14px', color: '#fff', whiteSpace:'nowrap'}}>Open Balance</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {reportData.data.length > 0 ? reportData.data.map((group: any) => (
                <React.Fragment key={group.bucket}>
                  {/* Bucket Header Row */}
                  <TableRow
                    sx={{
                      '& > *': { borderBottom: 'none' },
                      bgcolor: '#fff',
                      '&:hover': { bgcolor: '#fff' },
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleBucket(group.bucket)}
                  >
                    <TableCell sx={{ p: 0 }}>
                      <IconButton aria-label="expand row" size="small" style={{ padding: '0px 0px 0px 10px' }} sx={{ color: 'primary.main', display: group.invoices.length <= 1 ? "none" : "block" }}>
                        {expandedBuckets[group.bucket] ? <KeyboardArrowUp style={{ verticalAlign: 'middle', fontSize:'18px' }} /> : <KeyboardArrowDown style={{ verticalAlign: 'middle', fontSize:'18px' }} />}
                      </IconButton>
                    </TableCell>
                    <TableCell colSpan={8} sx={{ fontWeight: 600, pl: 0 }}>
                      {bucketLabels[group.bucket]} ({group.invoices.length})
                    </TableCell>
                  </TableRow>

                  {/* Invoice Rows */}
                  {group.invoices.map((invoice: any, index: number) => (
                    <TableRow
                      key={invoice._id}
                      sx={{
                        display: expandedBuckets[group.bucket] || index === 0 ? 'table-row' : 'none',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                      }}
                    >
                      <TableCell sx={{ px: 0 }}></TableCell>
                      <TableCell className='cust_anchor' sx={{ pl: 0 }} onClick={() => navigate(navigationPath(invoice._id))}>{formatDate(invoice.date)}</TableCell>
                      <TableCell align='center' className='tellipsis'>
                        {transactionType}
                      </TableCell>
                      <TableCell align='center' className='tellipsis'>{invoice.num || "-"}</TableCell>
                      <TableCell align='center' className='tellipsis'>{invoice.vendorDisplayName}</TableCell>
                      <TableCell align='center'>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell align='center'>{invoice.daysPastDue}</TableCell>
                      <TableCell align='right'>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell align='right'>{formatCurrency(invoice.openBalance)}</TableCell>
                    </TableRow>
                  ))}

                  {/* Subtotal Row */}
                  <TableRow sx={{
                    backgroundColor: '#e4ecfd',
                    '&:hover': { backgroundColor: '#e4ecfd' },
                  }}>
                    <TableCell colSpan={7} sx={{ fontWeight: 600 }}>
                      Total for {bucketLabels[group.bucket]}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px' }}>
                      {formatCurrency(group.totalAmount)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px' }}>
                      {formatCurrency(group.totalOpenBalance)}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 2, textAlign: "center", color: 'text.secondary', fontSize: '16px' }}>
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
                <TableCell colSpan={7} sx={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>
                  Total
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>
                  {formatCurrency(reportData.totalAmountWithTax)}
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>
                  {formatCurrency(reportData.totalDueAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default SharedAgingDetailCard
