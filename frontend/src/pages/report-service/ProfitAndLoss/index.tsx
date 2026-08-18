import { Box, CircularProgress, Button, ButtonGroup, Tooltip } from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { useQuery } from "@tanstack/react-query";
import {allowedreports, ReportData} from "@/types"
import ProfitAndLossCard from "./ProfitAndLossCard";
import apiService from "@/service/apiService";
import FilterBar from "../FilterBar";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { withPermission } from "@/hooks/authUtils";
import ErrorHandlerAlert from "@/components/common/ErrorHandlerAlert";
import { useParams } from "react-router-dom";
const ProfitAndLoss = () => {
    const filters = useSelector((state: RootState) => state.report);
    const { type } = useParams<{ type: allowedreports }>();
    const { data: reportData, isLoading, refetch,error } = useQuery<ReportData, Error, ReportData>({
        queryKey: [type, filters.reportPeriod,filters.toDate,filters.fromDate,filters.customerId],
        queryFn: async () => {
            const response = await apiService.getReport({allowedType:"all", fromDate: filters.fromDate, toDate: filters.toDate,type:"profit-and-loss" });
            return response.data
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <ErrorHandlerAlert error={error}/>
                    </Box>

                </Box>
                <FilterBar onApplyFilters={handleApplyFilters} />
                {reportData && <ProfitAndLossCard reportData={reportData} />}
            </Box>
    );
};

export default withPermission("view",["accounting"])(ProfitAndLoss);