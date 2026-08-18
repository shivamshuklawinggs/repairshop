import { Grid, Paper, Select, MenuItem, FormControl, InputLabel, Button, Box, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setReportPeriod, setFromDate, setToDate, setCustomerId } from '@/store/reports';
import { useNavigate, useParams } from 'react-router-dom';
import { allowedreports } from '@/types';
import { reports } from "./constant";
import CustomDatePicker from "@/components/common/CommonDatePicker";
import apiService from "@/service/apiService";
import { getAllDataOfCustomers, getAllDataOfVendors } from "@/utils/getAllDataByApi";
interface FilterBarProps {
    onApplyFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onApplyFilters }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const { reportPeriod, fromDate, toDate, customerId } = useSelector((state: RootState) => state.report);
    const { type } = useParams<{ type: allowedreports }>()
    const [customers, setCustomers] = useState<any[]>([]);

    // Check if current report type should show customer filter
    const shouldShowCustomerFilter = type === 'AccountsReceiveable' || type === 'AccountsPayable' ||
                                     type === 'AccountsRecieveableDetail' || type === 'AccountsPayableDetail';

    useEffect(() => {
        const fetchCustomers = async () => {
            if (shouldShowCustomerFilter) {
                try {
                    if(["AccountsReceiveable","AccountsRecieveableDetail"].includes(type)){
                        const response = await getAllDataOfCustomers()
                        console.log(response)
                        setCustomers(response || []);
                        return
                    }
                    else if(["AccountsPayable","AccountsPayableDetail"].includes(type)){
                        const response = await getAllDataOfVendors()
                         console.log(response)
                        setCustomers(response || []);
                        return
                    }
                } catch (error) {
                    console.error('Error fetching customers:', error);
                }
            }
        };
        fetchCustomers();
    }, [shouldShowCustomerFilter]);

    const handleApply = () => {
        onApplyFilters();
    };

    return (<>

        <Box sx={{ mb: 3.5 }}>
        <Typography fontWeight={600} fontSize={{xs:16, md:17}}>
          Reports
        </Typography>
        <Typography fontSize={{xs:13, md:14}} color="text.secondary">
          View business insights and reports.
        </Typography>
      </Box>

        <Paper elevation={0}
        sx={{
        background:'transparent',
        //backgroundColor:'#fff',
        //padding:'18px 15px',
        //borderRadius:0.5,
        //border:'1px solid #e2e8f0',
        }}>
            {type === "TrialBalanceReport" ? (
                // Trial Balance Report specific filters
                <Grid container spacing={2} alignItems="center">
                    {/* From Date */}
                    <Grid item xs={12} sm={6} md={6}>
                        <CustomDatePicker
                            size="small"
                            fullWidth
                            label="As of Date"
                            value={fromDate}
                            name="fromDate"
                            onChange={(e) => {
                                dispatch(setFromDate(new Date(e.target.value) || undefined))
                            }}
                        />
                    </Grid>
                    {/* Accounting method */}
                    <Grid item xs={12} sm={6} md={6}>
                        <FormControl size='small' fullWidth>
                            <InputLabel>Accounting method</InputLabel>
                            <Select value={type} label="Accounting method" onChange={(e) => { navigate(`/reports/${e.target.value}`) }}>
                                <MenuItem value="" disabled selected>Method</MenuItem>
                                {reports.map((report) => (
                                    <MenuItem key={report.path} value={report.path}>
                                        {report.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* Run Report */}
                    {/* <Grid item xs={12} sm={6} md={2} container alignItems="center">
                            <Button className='themBtn' onClick={handleApply}
                            variant="contained"
                            fullWidth
                            sx={{ borderRadius: '8px', fontSize:'14px'}}
                            >Run Report
                            </Button>
                    </Grid> */}
                </Grid>
            ) : (
                // Other reports filters
                <Grid container spacing={2} alignItems="center">
                    {/* Report period */}
                    <Grid item xs={12} sm={6} md={shouldShowCustomerFilter ? 2.4 : 3}>
                        <FormControl size='small' fullWidth>
                            <InputLabel>Report period</InputLabel>
                            <Select value={reportPeriod} label="Report period" onChange={(e) => dispatch(setReportPeriod(e.target.value))}>
                                <MenuItem value="this_year_to_date">This year to date</MenuItem>
                                <MenuItem value="custom">Custom</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* From Date */}
                    <Grid item xs={12} sm={6} md={shouldShowCustomerFilter ? 2.4 : 3}>
                        <CustomDatePicker
                            size="small"
                            fullWidth
                            label="From"
                            value={fromDate}
                            name="fromDate"
                            onChange={(e) => {
                                dispatch(setFromDate(new Date(e.target.value) || undefined))
                            }}
                            disabled={reportPeriod !== 'custom'}
                        />
                    </Grid>
                    {/* To Date */}
                    <Grid item xs={12} sm={6} md={shouldShowCustomerFilter ? 2.4 : 3}>
                        <CustomDatePicker
                            size="small"
                            fullWidth
                            label="To"
                            value={toDate}
                            name="toDate"
                            minDate={fromDate || undefined}
                            onChange={(e) => {
                                dispatch(setToDate(new Date(e.target.value) || undefined))
                            }}
                            disabled={reportPeriod !== 'custom'}
                        />
                    </Grid>
                    {/* Customer Filter - only for aging reports */}
                    {shouldShowCustomerFilter && (
                        <Grid item xs={12} sm={6} md={2.4}>
                            <FormControl size='small' fullWidth>
                                <InputLabel>Customer</InputLabel>
                                <Select
                                    value={customerId || ''}
                                    label="Customer"
                                    onChange={(e) => dispatch(setCustomerId(e.target.value || undefined))}

                                >
                                    <MenuItem value="">
                                        <em>All Customers</em>
                                    </MenuItem>
                                    {customers.map((customer) => (
                                        <MenuItem key={customer._id} value={customer._id}>
                                            {customer.company}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {/* Accounting method */}
                    <Grid item xs={12} sm={6} md={shouldShowCustomerFilter ? 2.4 : 3}>
                        <FormControl size='small' fullWidth>
                            <InputLabel>Accounting method</InputLabel>
                            <Select value={type} label="Accounting method" onChange={(e) => { navigate(`/reports/${e.target.value}`) }}>
                                <MenuItem value="" disabled selected>Method</MenuItem>
                                {reports.map((report) => (
                                    <MenuItem key={report.path} value={report.path}>
                                        {report.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* Run Report */}
                    {/* <Grid item xs={12} md={shouldShowCustomerFilter ? 2 : 2} container alignItems="center">
                        <Button className='themBtn' onClick={handleApply}
                        variant="contained"
                        fullWidth
                        sx={{ borderRadius: '8px', fontSize:'14px'}}
                        >
                        Run Report
                        </Button>
                    </Grid> */}
                </Grid>
            )}
        </Paper>
        </>
    );
};

export default FilterBar;
