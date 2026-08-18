import { FC } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from "@mui/material";
import { allowedreports } from "@/types";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Reporttitle } from "@/pages/report-service/constant";
import { useNavigate, useParams } from "react-router-dom";
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from "@/utils";
import { paths } from "@/utils/paths";
import ExportButtons from "@/pages/report-service/ExportButtons";

interface SharedAgingReportCardProps {
  reportData: any;
  navigationPath: (customerId: string) => string;
  type?: allowedreports;
}

const SharedAgingReportCard: FC<SharedAgingReportCardProps> = ({ reportData, navigationPath, type }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const filters = useSelector((state: RootState) => state.report);
  const { type: routeType } = useParams<{ type: allowedreports }>();
  const displayType = routeType || type;

  return (
    <Box sx={{ p: 0, maxWidth: '100%', mx: 'auto', mt: 3 }}>
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

      <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(37,99,235,0.12)', whiteSpace:'nowrap' }}>Customer</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(0, 255, 213, 0.12)', whiteSpace:'nowrap' }}>
                  Current
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(220, 38, 38, 0.10)', whiteSpace:'nowrap'}}>
                  1 - 30
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(220, 38, 38, 0.20)', whiteSpace:'nowrap'}}>
                  31 - 60
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(220, 38, 38, 0.30)', whiteSpace:'nowrap'}}>
                  61 - 90
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(220, 38, 38, 0.40)', whiteSpace:'nowrap'}}>
                  91 and over
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', bgcolor: 'rgba(37,99,235,0.12)', whiteSpace:'nowrap'}}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {reportData?.data?.length > 0 ? (
                reportData?.data.map((item: any) => (
                  <TableRow key={item._id}>
                    <TableCell className="tellipsis" sx={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(navigationPath(item.customer._id))}>
                      {item?.customer?.name}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.currentDueAmount)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.due_0_30)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.due_31_60)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.due_61_90)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.due_90_plus)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.totalDueAmount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '16px' }}>
                    No records found
                  </TableCell>
                </TableRow>
              )}

              {/* Total row */}
              <TableRow sx={{
                bgcolor: 'primary.main',
                '&:hover':
                  { bgcolor: 'primary.main' },
              }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.currentDueAmount)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.due_0_30)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.due_31_60)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.due_61_90)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.due_90_plus)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                  {formatCurrency(reportData?.totalData?.totalDueAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SharedAgingReportCard;
