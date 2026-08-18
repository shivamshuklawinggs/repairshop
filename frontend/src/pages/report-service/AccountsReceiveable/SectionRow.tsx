



import { Box, Collapse, IconButton, Table, TableBody, TableCell,TableRow, Typography } from "@mui/material";
import React, { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {ReportSection} from "@/types"
const SectionRow: React.FC<{ section: ReportSection, name: string }> = ({ section, name }) => {
    const [open, setOpen] = useState(true);

    return (
        <React.Fragment>
            <TableRow
            sx={{
                '& > *': { borderBottom: 'none' },
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#fff' },
                cursor: 'pointer'
                }}>

                <TableCell sx={{px: 1, width:'50%'}}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <IconButton aria-label="expand row" size="small" sx={{ color: 'primary.main'}} onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                    <Typography fontSize={15} sx={{ fontWeight: 500 }}>{name}</Typography>
                    </Box>
                </TableCell>

                <TableCell align="right" sx={{width:'50%'}}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {section?.total?.toFixed(2)}
                </Typography>
                </TableCell>
            </TableRow>

            <TableRow sx={{backgroundColor:'rgba(0, 0, 0, 0.04)'}}>
                <TableCell style={{ padding:0 }} colSpan={2}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 0, px: 0, bgcolor: '#fff', borderRadius: 0, my: 0, border:'none' }}>
                            <Table size="small" aria-label="details">
                                <TableBody>
                                    {section?.data?.map((item) => (
                                        <TableRow key={item?._id}
                                         sx={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                                            }}
                                        >
                                        <TableCell component="th" scope="row" sx={{ py:1.2, borderBottom: '1px solid', borderColor: 'divider', cursor:'pointer', width:'50%' }}>{item?.name}</TableCell>
                                        <TableCell align="right" sx={{ py:1.2, borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary', width:'50%' }}>{item?.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow
                                    sx={{
                                    backgroundColor: '#e4ecfd',
                                    '&:hover': { backgroundColor: '#e4ecfd' },
                                    }}>
                                    <TableCell sx={{ fontWeight: 600, py: 1.2, borderTop: '1px solid', borderColor: 'divider'}}>
                                        {/* Total for {name} */}
                                        Total
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.2, borderTop: '1px solid', borderColor: 'divider', fontSize:'15px'}}>{section?.total?.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};
export default SectionRow