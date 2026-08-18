import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from "@mui/material";
import React, { FC } from "react";
import SectionRow from "./SectionRow";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useParams } from "react-router-dom";
import { allowedreports, BalanceSheetData, IBalanceSheetGroup } from "@/types";
import { Reporttitle } from "../constant";
import { formatDate } from '@/utils/dateUtils';
import ExportButtons from "../ExportButtons";


interface BalanceSheetProps {
    reportData: BalanceSheetData;
}

const BalanceSheetCard: FC<BalanceSheetProps> = ({ reportData }) => {
    const theme = useTheme()
    const filters = useSelector((state: RootState) => state.report);
    const { type = "balance-sheet" } = useParams<{ type: allowedreports }>()
    const renderSections = (sections: IBalanceSheetGroup[] = []) => (
        <React.Fragment>

            {sections.map(section => (
                <SectionRow key={section._id} section={section} name={section._id} />
            ))}
        </React.Fragment>
    );

    // const getSectionsByType = (items?: BalanceSheetIassets[], typeName?: string) => {
    //     if (!items || !typeName) return [];
    //     return items.filter(i => i.type === typeName || i.name === typeName);
    // }

    const totals = reportData?.totals;
    const totalAssets = totals?.TotalAssets ?? 0;
    const totalLiabilitiesAndEquity = totals?.TotalLiabilitiesAndEquity ?? 0;
    const isNotAvaible = totalAssets === 0 && totalLiabilitiesAndEquity === 0
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
                    {reportData && <ExportButtons reportType={"balance-sheet"} reportData={reportData} />}
                </Box>

            </Box>


            <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
                <TableContainer>
                    <Table aria-label="balance sheet table" size="small">
                        <TableBody>
                            {
                                !isNotAvaible ?
                                    <React.Fragment>
                                        {/* Assets Section */}
                                        <TableRow
                                            sx={{
                                                bgcolor: 'primary.main',
                                                '&:hover':
                                                    { bgcolor: 'primary.main' },
                                            }}>
                                            <TableCell align="left" sx={{ fontWeight: 500, fontSize: '14px', color: '#fff' }}>Assets</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 500, fontSize: '14px', color: '#fff' }}> Amount</TableCell>
                                        </TableRow>

                                        {renderSections(reportData?.Assets)}
                                        <TableRow
                                            sx={{
                                                bgcolor: 'primary.main',
                                                '&:hover':
                                                    { bgcolor: 'primary.main' },
                                            }}>
                                            <TableCell align="left" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Total Assets</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>${totalAssets.toFixed(2)}</TableCell>
                                        </TableRow>
                                        {/* Liabilities and Equity Section */}
                                        <TableRow
                                            sx={{
                                                bgcolor: '#3585ae',
                                                '&:hover':
                                                    { bgcolor: '#3585ae' },
                                            }}>
                                            <TableCell align="left" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Liabilities & Equity</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Amount</TableCell>
                                        </TableRow>

                                        {renderSections(reportData?.Liabilities)}
                                        <TableRow
                                            sx={{
                                                bgcolor: '#3585ae',
                                                '&:hover':
                                                    { bgcolor: '#3585ae' },
                                            }}>
                                            <TableCell align="left" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Total Liabilities & Equity</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>${totalLiabilitiesAndEquity.toFixed(2)}</TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                    : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 2, textAlign: "center", color: 'text.secondary', fontSize: '16px' }}>
                                                No records found
                                            </TableCell>
                                        </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    )
}

export default BalanceSheetCard;