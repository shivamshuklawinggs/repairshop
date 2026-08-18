import { Box, CircularProgress } from "@mui/material";

import  { FC } from 'react';
import { useQuery } from "@tanstack/react-query";
import {allowedreports, IAccountsRecieveableDetail} from "@/types"
import AgingReport from "./AccountsRecieveableDetailCard";
import apiService from "@/service/apiService";
import FilterBar from "../FilterBar";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { withPermission } from "@/hooks/authUtils";
import { useParams } from "react-router-dom";
import ErrorHandlerAlert from "@/components/common/ErrorHandlerAlert";
import ExportButtons from "../ExportButtons";

const AccountsRecieveableDetailReport:FC= () => {
        const {type="AccountsRecieveableDetail"}=useParams<{type:allowedreports}>()
    const filters = useSelector((state: RootState) => state.report);
    const { data: reportData, isLoading, refetch,error } = useQuery<IAccountsRecieveableDetail, Error, IAccountsRecieveableDetail>({
        queryKey: [type, filters.reportPeriod,filters.toDate,filters.fromDate,filters.customerId],
        queryFn: async () => {
            const response = await apiService.getReport({ 
                fromDate:filters.fromDate, 
                toDate:filters.toDate,
                type:type,
                customerId: filters.customerId
            });
            return response
        },
         enabled: true, // Disable automatic fetching
    });
    const handleApplyFilters = () => {
        refetch(); // Manually refetch data when filters are applied
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
            <Box>
                <ErrorHandlerAlert error={error}/>
                <FilterBar onApplyFilters={handleApplyFilters} />
                {reportData && <AgingReport reportData={reportData} />}
            </Box>
    );
};

export default withPermission("view",["accounting"])(AccountsRecieveableDetailReport);