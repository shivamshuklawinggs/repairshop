import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { FC } from "react";
import { allowedreports, ReportData } from "@/types";
import SectionRow from "./SectionRow";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useParams } from "react-router-dom";
import { Reporttitle } from "../constant";
import { formatDate } from "@/utils/dateUtils";
import { findReportByTypeId } from "../utils/FindBYTypeidReport";
import { ProfitAndLossTypeIds } from "@/types/enum";
import { formatCurrency } from "@/utils";
import apiService from "@/service/apiService";
import ExportButtons from "../ExportButtons";

interface ProfitAndLossProps {
    reportData: ReportData;
}

const ProfitAndLossCard: FC<ProfitAndLossProps> = ({ reportData }) => {
    const theme=useTheme()
    const filters = useSelector((state: RootState) => state.report);
    const { type = "profit-and-loss" } = useParams<{ type: allowedreports }>()


    // sections
    const incomeSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.income, reportData) : undefined;
    const COGSSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.costOfGoodsSold, reportData) : undefined;
    const expenseSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.expense, reportData) : undefined;
    const otherIncomeSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.otherIncome, reportData) : undefined;
    const otherExpenseSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.otherExpense, reportData) : undefined;
    // totals
    const grossProfit =reportData?.totals?.grossProfit || 0
    const totalCOGS =reportData?.totals?.COGS || 0
    const totalExpense =reportData?.totals?.Expenses || 0
    const totalIncome =reportData?.totals?.Income || 0
    const totalOtherIncome =reportData?.totals?.OtherIncome || 0
    const totalOtherExpense =reportData?.totals?.OtherExpense || 0
    const totalNetOperatingIncome =reportData?.totals?.netOperatingIncome || 0
    const totalNetOtherIncome =reportData?.totals?.netOtherIncome || 0
    const totalNetProfit =reportData?.totals?.netProfit || 0


    return (
        <Box sx={{ p:0, maxWidth: '100%', mx: 'auto', mt:3 }}>
            <Box
             sx={{
                display:{xs:'block', md:'flex'},
                justifyContent:'space-between',
                alignItems:'center',
                mb:2,
             }}
            >
                <Box>
                    <Typography fontSize={{xs:16, md:17}} fontWeight={600}>
                         {Reporttitle[type]}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                        {formatDate(filters.fromDate)} - {formatDate(filters.toDate)}
                    </Typography>
                </Box>

                <Box>
                {reportData && <ExportButtons reportType={'profit-and-loss'} reportData={reportData} />}
                </Box>

            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
            <TableContainer>
                <Table aria-label="profit and loss table">
                    <TableHead>
                        <TableRow sx={{
                        bgcolor: 'primary.main',
                        '&:hover':
                        { bgcolor: 'primary.main' },
                        }}>
                        <TableCell sx={{fontWeight: 500, fontSize: '14px', color:'#fff' }}>Category</TableCell>
                        <TableCell align="right" sx={{fontWeight: 500, fontSize: '14px', color:'#fff' }}>Amount</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {incomeSection && <SectionRow section={incomeSection} name="Income" total={totalIncome} />}
                        {COGSSection && <SectionRow section={COGSSection} name="Cost of Goods Sold" total={totalCOGS} />}

                        <TableRow
                        sx={{
                            bgcolor: '#25eba11f',
                            '&:hover':
                            { bgcolor: '#25eba11f' },
                        }}
                        >
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px'}}>Gross Profit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: grossProfit >= 0 ? '#00933b' : '#eb3030' }}>
                        {
                        formatCurrency(grossProfit)
                         }
                        </TableCell>
                        </TableRow>

                        {expenseSection && <SectionRow section={expenseSection} name="Expenses" total={totalExpense} />}
                        <TableRow
                        sx={{
                            bgcolor: 'rgba(245,158,11,0.12)',
                            '&:hover':
                            { bgcolor: 'rgba(245,158,11,0.12)' },
                            }}
                            >
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px'}}>Net Operating Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: totalNetOperatingIncome >= 0 ? '#00933b' : '#eb3030' }}>
                        {
                        formatCurrency(totalNetOperatingIncome)
                        }
                        </TableCell>
                        </TableRow>

                        {otherIncomeSection && <SectionRow section={otherIncomeSection} name="Other Income" total={totalOtherIncome} />}
                        {otherExpenseSection && <SectionRow section={otherExpenseSection} name="Other Expenses" total={totalOtherExpense} />}
                        <TableRow
                        sx={{
                            bgcolor: 'rgb(237 58 58 / 12%)',
                            '&:hover':
                            { bgcolor: 'rgb(237 58 58 / 12%)' },
                            }}>

                        <TableCell sx={{ fontWeight: 600, fontSize: '14px'}}>Net Other Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: totalNetOtherIncome >= 0 ? '#00933b' : '#eb3030' }}>
                        {
                        formatCurrency(totalNetOtherIncome)
                        }
                        </TableCell>
                        </TableRow>

                         <TableRow sx={{
                        bgcolor: 'primary.main',
                        '&:hover':
                        { bgcolor: 'primary.main' },
                        }}>

                        <TableCell sx={{ fontWeight: 500, fontSize: '16px', color:'#fff' }}>Net Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '16px', color: totalNetProfit >= 0 ? '#1bda68' : '#ff4949' }}>
                        {
                        formatCurrency(totalNetProfit)
                        }
                        </TableCell>
                        </TableRow>
                    </TableBody>

                </Table>
            </TableContainer>
            </Paper>
        </Box>
    )
}

export default ProfitAndLossCard;