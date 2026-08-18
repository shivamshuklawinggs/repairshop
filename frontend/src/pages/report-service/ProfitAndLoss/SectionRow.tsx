import { Box, Collapse, IconButton, Table, TableBody, TableCell,TableRow, Typography } from "@mui/material";
import React, { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {ReportSection} from "@/types"
import { formatCurrency } from "@/utils";
import { useNavigate } from "react-router-dom";
import { paths } from "@/utils/paths";
const SectionRow: React.FC<{ section: ReportSection, name: string,total: number }> = ({ section, name,total }) => {
    const [open, setOpen] = useState(true);
    const navigate=useNavigate()
    return (
        <React.Fragment>
            <TableRow
                sx={{
                    '& > *': { borderBottom: 'none' },
                    bgcolor: '#fff',
                    '&:hover': { bgcolor: '#fff' },
                    cursor: 'pointer'
                }}
                onClick={() => setOpen(!open)}
            >
                <TableCell sx={{px: 0.5, width:'50%', py:0}}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <IconButton aria-label="expand row" size="small" style={{padding:'0px 2px 0px 5px'}} sx={{ color: 'primary.main'}}>
                            {open ? <KeyboardArrowUpIcon style={{verticalAlign:'middle', fontSize:'18px'}}/> : <KeyboardArrowDownIcon style={{verticalAlign:'middle', fontSize:'18px'}}/>}
                        </IconButton>
                        <Typography fontSize={{ xs: 13, md: 14 }} sx={{ fontWeight: 600 }}>{name}</Typography>
                    </Box>
                </TableCell>

                <TableCell align="right" sx={{width:'50%'}}>
                    <Typography fontSize={{ xs: 13, md: 14 }} sx={{ fontWeight: 600 }}>
                        {formatCurrency(total)}
                    </Typography>
                </TableCell>
            </TableRow>


            <TableRow>
                <TableCell style={{ padding:0}} colSpan={2}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 0, px: 0, bgcolor: '#fff', borderRadius: 0, my: 0, border:'none' }}>
                            <Table size="small" aria-label="details">
                                <TableBody>
                                    {section?.data?.map((item) => (
                                        <TableRow
                                            key={item._id}
                                            sx={{
                                                backgroundColor: '#fff',
                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                                            }}
                                        >
                                            <TableCell onClick={()=>navigate(`${paths.AccountRegister}/${item._id}`)} component="th" scope="row" sx={{borderBottom: '1px solid', borderColor: 'divider', cursor:'pointer', width:'50%', pl:3.5}}>
                                                {item.name}
                                            </TableCell>
                                            <TableCell align="right" sx={{borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary', width:'50%' }}>
                                                {formatCurrency(item.totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow
                                    sx={{
                                        backgroundColor: '#e4ecfd',
                                        '&:hover': { backgroundColor: '#e4ecfd' },
                                        }}>

                                        <TableCell sx={{ fontWeight: 600, borderTop: '1px solid', borderColor: 'divider', whiteSpace:'nowrap'}}>
                                            Total for {name}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, borderTop: '1px solid', borderColor: 'divider', fontSize:'14px'}}>
                                            {formatCurrency(total)}
                                        </TableCell>
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