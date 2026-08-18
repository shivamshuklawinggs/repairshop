import { Box, Collapse, IconButton, Table, TableBody, TableCell,TableRow, Typography } from "@mui/material";
import React, { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {ReportSection} from "@/types"
const SectionRow: React.FC<{ section: ReportSection, name: string }> = ({ section, name }) => {
    const [open, setOpen] = useState(true);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                    <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                </TableCell>
                <TableCell align="right"><Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>{section?.total?.toFixed(2)}</Typography></TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Table size="small" aria-label="details">
                                <TableBody>
                                    {section?.data?.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell component="th" scope="row">{item.name}</TableCell>
                                            <TableCell align="right">{item.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Total for {name}
                                            {/* Total */}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{section?.total?.toFixed(2)}</TableCell>
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