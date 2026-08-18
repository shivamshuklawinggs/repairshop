import { Box, Collapse, IconButton, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import React, { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { capitalizeFirstLetter } from "@/utils";
import { paths } from "@/utils/paths";
import { useNavigate } from "react-router-dom";
import { IBalanceSheetGroup } from "@/types";



const SectionRow: React.FC<{ section: IBalanceSheetGroup, name: string }> = ({ section, name }) => {
    const navigate=useNavigate()
    const [open, setOpen] = useState(true);

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, padding:'0px' }}>
                        <IconButton aria-label="expand row" size="small" style={{padding:'0px 2px 0px 5px'}} sx={{ color: 'primary.main' }}>
                            {open ? <KeyboardArrowUpIcon style={{verticalAlign:'middle', fontSize:'18px'}}/> : <KeyboardArrowDownIcon style={{verticalAlign:'middle', fontSize:'18px'}}/>}
                        </IconButton>
                        <Typography fontSize={{xs:13, md:14}} sx={{ fontWeight: 600, whiteSpace:'nowrap' }}>{section.name}</Typography>
                    </Box>
                </TableCell>

                <TableCell align="right" sx={{width:'50%'}}>
                    <Typography fontSize={{xs:13, md:14}} sx={{ fontWeight: 600 }}>
                        ${section?.endingBalance?.toFixed(2)}
                    </Typography>
                </TableCell>
            </TableRow>

            <TableRow>
                <TableCell style={{padding:0}} colSpan={2}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 0, px: 0, bgcolor: '#fff', borderRadius: 0, my: 0, border:'none' }}>
                            <Table size="small" aria-label="details">
                                <TableBody>
                                    {section?.data?.map((item) => (
                                        <TableRow
                                            key={item._id}
                                            sx={{
                                                backgroundColor: '#fff',
                                                whiteSpace:'nowrap',
                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                                            }}
                                        >
                                            <TableCell onClick={()=>item._id && navigate(`${paths.AccountRegister}/${item._id}`)}  component="th" scope="row" sx={{borderBottom: '1px solid', borderColor: 'divider', cursor:item._id ?'pointer':"not-allowed", width:'50%', pl:3.5 }}>
                                                {capitalizeFirstLetter(item.name)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary', width:'50%' }}>
                                                ${item.endingBalance.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow
                                    sx={{
                                        backgroundColor: '#e4ecfd',
                                        whiteSpace:'nowrap',
                                        '&:hover': { backgroundColor: '#e4ecfd' },
                                    }}>

                                    <TableCell sx={{ fontWeight: 600, borderTop: '1px solid', borderColor: 'divider' }}>
                                        Total For {section.name}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, borderTop: '1px solid', borderColor: 'divider', fontSize:'14px'}}>
                                        ${section?.endingBalance?.toFixed(2)}
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
export default SectionRow;