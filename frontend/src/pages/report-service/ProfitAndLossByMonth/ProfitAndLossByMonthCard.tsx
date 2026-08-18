import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Collapse, IconButton, useTheme } from "@mui/material";
import { FC, useMemo, useState } from "react";
import { allowedreports, ReportData, ReportSection, ReportRowData } from "@/types";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useNavigate, useParams } from "react-router-dom";
import { Reporttitle } from "../constant";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import moment from "moment";
import { formatDate } from "@/utils/dateUtils";
import { findReportByTypeId } from "../utils/FindBYTypeidReport";
import { ProfitAndLossTypeIds } from "@/types/enum";
import { formatCurrency } from "@/utils";
import { paths } from "@/utils/paths";
import ExportButtons from "../ExportButtons";

interface ProfitAndLossByMonthProps {
    reportData: ReportData;
}

interface MonthYear {
    month: number;
    year: number;
    label: string;
}

const ProfitAndLossByMonthCard: FC<ProfitAndLossByMonthProps> = ({ reportData }) => {
    const theme = useTheme()
    const navigate = useNavigate();
    const filters = useSelector((state: RootState) => state.report);
    const { type = "balance-sheet" } = useParams<{ type: allowedreports }>()
    // sections
    const incomeSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.income, reportData) : undefined;
    console.log("incomeSection",incomeSection)
    const COGSSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.costOfGoodsSold, reportData) : undefined;
    const expenseSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.expense, reportData) : undefined;
    const otherIncomeSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.otherIncome, reportData) : undefined;
    const otherExpenseSection = reportData.data ? findReportByTypeId(ProfitAndLossTypeIds.otherExpense, reportData) : undefined;
    // totals
    const grossProfit = reportData?.totals?.grossProfit || 0
    const totalNetOperatingIncome = reportData?.totals?.netOperatingIncome || 0
    const totalNetOtherIncome = reportData?.totals?.netOtherIncome || 0
    const totalNetProfit = reportData?.totals?.netProfit || 0
    // Extract all unique months from the data
    const months = useMemo(() => {
        const monthSet = new Set<string>();
        const sections = [incomeSection, COGSSection, expenseSection, otherIncomeSection, otherExpenseSection];

        // Extract months from section-level monthlyTotals
        sections.forEach(section => {
            section?.monthlyTotals?.forEach(mt => {
                monthSet.add(`${mt.year}-${mt.month}`);
            });
        });

        // Also check reportData.monthlyTotals if sections don't have data
        reportData?.monthlyTotals?.forEach(mt => {
            monthSet.add(`${mt.year}-${mt.month}`);
        });

        const monthArray: MonthYear[] = Array.from(monthSet).map(key => {
            const [year, month] = key.split('-').map(Number);
            return {
                month,
                year,
                label: moment().year(year).month(month - 1).format('MMMM YYYY')
            };
        });

        // Sort by year and month
        return monthArray.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
    }, [reportData, incomeSection, COGSSection, expenseSection, otherIncomeSection, otherExpenseSection]);

    // Helper function to get amount for a specific month
    const getMonthAmount = (row: ReportRowData, month: number, year: number): number => {
        const monthData = row.monthlyTotals?.find(mt => mt.month === month && mt.year === year);
        return monthData?.totalAmount || 0;
    };

    // Helper function to calculate section total for a month
    const getSectionMonthTotal = (section: ReportSection, month: number, year: number): number => {
        // Use section-level monthlyTotals if available
        const sectionMonthData = section?.monthlyTotals?.find(mt => mt.month === month && mt.year === year);
        if (sectionMonthData) {
            return sectionMonthData.totalAmount || 0;
        }
        // Fallback to summing row-level data
        return section?.data?.reduce((sum, row) => sum + getMonthAmount(row, month, year), 0) || 0;
    };

    // Collapsible Section Component
    const CollapsibleSection: FC<{ section: ReportSection; name: string; isSubtraction?: boolean }> = ({ section, name, isSubtraction = false }) => {
        const [open, setOpen] = useState(true);

        return (
            <>
                <TableRow
                    sx={{
                        '& > *': { borderBottom: 'none' },
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#fff' },
                        cursor: 'pointer'
                    }}
                    onClick={() => setOpen(!open)}
                >
                    <TableCell sx={{ px: 0.5, py:0 }} colSpan={months.length + 2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                            <IconButton size="small" style={{padding:'0px 2px 0px 5px'}} sx={{ color: 'primary.main' }}>
                                {open ? <KeyboardArrowUpIcon style={{verticalAlign:'middle', fontSize:'18px'}}/> : <KeyboardArrowDownIcon style={{verticalAlign:'middle', fontSize:'18px'}}/>}
                            </IconButton>
                            <Typography fontSize={{ xs: 13, md: 14 }} sx={{ fontWeight: 600 }}>{name}</Typography>
                        </Box>
                    </TableCell>

                </TableRow>

                {section?.data?.map((row, index) => (
                    <TableRow
                        key={row._id}
                        sx={{
                        backgroundColor: '#fff',
                        whiteSpace:'nowrap',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
                        opacity: open ? 1 : 0,
                        transform: open ? 'translateY(0)' : 'translateY(-8px)',
                        visibility: open ? 'visible' : 'collapse'
                        }}>

                    <TableCell onClick={() => navigate(`${paths.AccountRegister}/${row._id}`)} sx={{borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', pl:3.5 }}>{row.name}</TableCell>
                    {months.map(m => (
                    <TableCell key={`${row._id}-${m.year}-${m.month}`} align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
                    {formatCurrency(getMonthAmount(row, m.month, m.year))}
                    </TableCell>
                    ))}
                    <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>{formatCurrency(row.totalAmount)}</TableCell>
                    </TableRow>
                ))}

                {/* Section Total Row */}
                <TableRow
                    sx={{
                        backgroundColor: '#f5f5f5',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        opacity: open ? 1 : 0,
                        transform: open ? 'translateY(0)' : 'translateY(-8px)',
                        visibility: open ? 'visible' : 'collapse'
                    }}>
                    <TableCell sx={{ pl: 3.5, fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
                        {name} Total
                    </TableCell>
                    {months.map(m => (
                        <TableCell align="right" key={`total-${section._id}-${m.year}-${m.month}`}  sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
                            {formatCurrency(getSectionMonthTotal(section, m.month, m.year))}
                        </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
                        {formatCurrency(section.totalAmount)}
                    </TableCell>
                </TableRow>

            </>
        );
    };

    // Calculate monthly gross profit
    const getMonthlyGrossProfit = (month: number, year: number): number => {
        const income = incomeSection ? getSectionMonthTotal(incomeSection, month, year) : 0;
        const cogs = COGSSection ? getSectionMonthTotal(COGSSection, month, year) : 0;
        return income - cogs;
    };

    // Calculate monthly net operating income
    const getMonthlyNetOperatingIncome = (month: number, year: number): number => {
        const grossProfit = getMonthlyGrossProfit(month, year);
        const expense = expenseSection ? getSectionMonthTotal(expenseSection, month, year) : 0;
        return grossProfit - expense;
    };

    // Calculate monthly net other income
    const getMonthlyNetOtherIncome = (month: number, year: number): number => {
        const otherIncome = otherIncomeSection ? getSectionMonthTotal(otherIncomeSection, month, year) : 0;
        const otherExpense = otherExpenseSection ? getSectionMonthTotal(otherExpenseSection, month, year) : 0;
        return otherIncome - otherExpense;
    };

    // Calculate monthly net profit
    const getMonthlyNetProfit = (month: number, year: number): number => {
        const netOperatingIncome = getMonthlyNetOperatingIncome(month, year);
        const netOtherIncome = getMonthlyNetOtherIncome(month, year);
        return netOperatingIncome + netOtherIncome;
    };

    // Calculate total for each month across all sections
    const getMonthlyTotal = (month: number, year: number): number => {
        let total = 0;
        const sections = [incomeSection, COGSSection, expenseSection, otherIncomeSection, otherExpenseSection];

        sections.forEach(section => {
            if (section) {
                total += getSectionMonthTotal(section, month, year);
            }
        });

        return total;
    };

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
                        {Reporttitle[type]}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                        {formatDate(filters.fromDate)} - {formatDate(filters.toDate)}
                    </Typography>
                </Box>

                <Box>
                    {reportData && <ExportButtons reportType={"profit-and-loss-month"} reportData={reportData} />}
                </Box>

            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
                <TableContainer>
                    <Table aria-label="monthly profit and loss" size="small">
                        <TableHead>
                            <TableRow sx={{
                                bgcolor: 'primary.main',
                                '&:hover':
                                    { bgcolor: 'primary.main' },
                            }}>
                                {/* <TableCell sx={{ minWidth: 200, fontWeight: 700}}>Account</TableCell> */}
                                <TableCell sx={{ color: '#fff', fontWeight: 500}}>Category</TableCell>
                                {months.map(m => (
                                    <TableCell align="right" key={`header-${m.year}-${m.month}`} sx={{ color: '#fff', fontWeight: 500, whiteSpace:'nowrap'}}>
                                        {m.label}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ color: '#fff', fontWeight: 500}}>
                                    Amount
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {incomeSection && <CollapsibleSection section={incomeSection} name="Income" />}
                            {COGSSection && <CollapsibleSection section={COGSSection} name="Cost of Goods Sold" isSubtraction />}

                            <TableRow
                                sx={{
                                    bgcolor: '#25eba11f',
                                    '&:hover':
                                        { bgcolor: '#25eba11f' },
                                }}
                            >

                                <TableCell sx={{ fontWeight: 600, fontSize: '14px'}}>Gross Profit</TableCell>
                                {months.map(m => (
                                    <TableCell key={`gp-${m.year}-${m.month}`} align="right" sx={{ fontWeight: 600, fontSize: '14px'}}>
                                        {formatCurrency(getMonthlyGrossProfit(m.month, m.year))}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px',color: grossProfit >= 0 ? '#00933b' : '#eb3030'}}>
                                    {formatCurrency(grossProfit)}
                                </TableCell>
                            </TableRow>

                            {expenseSection && <CollapsibleSection section={expenseSection} name="Expenses" isSubtraction />}

                            <TableRow
                                sx={{
                                    bgcolor: 'rgba(245,158,11,0.12)',
                                    '&:hover':
                                        { bgcolor: 'rgba(245,158,11,0.12)' },
                                }}
                            >

                                <TableCell sx={{ fontWeight: 600, fontSize: '14px', whiteSpace:'nowrap'}}>Net Operating Income</TableCell>
                                {months.map(m => (
                                    <TableCell key={`noi-${m.year}-${m.month}`} align="right" sx={{ fontWeight: 600, fontSize: '14px'}}>
                                        {formatCurrency(getMonthlyNetOperatingIncome(m.month, m.year))}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px',color: totalNetOperatingIncome >= 0 ? '#00933b' : '#eb3030'}}>
                                    {formatCurrency(totalNetOperatingIncome)}
                                </TableCell>
                            </TableRow>


                            {otherIncomeSection && <CollapsibleSection section={otherIncomeSection} name="Other Income" />}
                            {otherExpenseSection && <CollapsibleSection section={otherExpenseSection} name="Other Expenses" isSubtraction />}

                            <TableRow
                                sx={{
                                    bgcolor: 'rgba(124,58,237,0.12)',
                                    '&:hover':
                                        { bgcolor: 'rgba(124,58,237,0.12)' },
                                }}>

                                <TableCell sx={{ fontWeight: 600, fontSize: '14px'}}>Net Other Income</TableCell>
                                {months.map(m => (
                                    <TableCell key={`noti-${m.year}-${m.month}`} align="right" sx={{ fontWeight: 600, fontSize: '14px'}}>
                                        {formatCurrency(getMonthlyNetOtherIncome(m.month, m.year))}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px',color: totalNetOtherIncome >= 0 ? '#00933b' : '#eb3030'}}>
                                    {formatCurrency(totalNetOtherIncome)}
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{
                                bgcolor: 'primary.main',
                                '&:hover':
                                    { bgcolor: 'primary.main' },
                            }}>
                                <TableCell sx={{ fontWeight: 500, fontSize: '15px', color: '#fff' }}>Net Income</TableCell>
                                {months.map(m => (
                                    <TableCell key={`np-${m.year}-${m.month}`} align="right" sx={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                                        {formatCurrency(getMonthlyNetProfit(m.month, m.year))}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '15px', color: totalNetProfit >= 0 ? '#1bda68' : '#ff4949'}}>
                                    {formatCurrency(totalNetProfit)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

        </Box>
    )
}

export default ProfitAndLossByMonthCard;