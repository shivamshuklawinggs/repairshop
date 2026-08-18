import { Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {allowedreports, ReportData} from "@/types"
import ProfitAndLossCard from "./ProfitAndLossByMonthCard";
import apiService from "@/service/apiService";
import FilterBar from "../FilterBar";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { withPermission } from "@/hooks/authUtils";
import ErrorHandlerAlert from "@/components/common/ErrorHandlerAlert";
import ExportButtons from "../ExportButtons";
import { useParams } from "react-router-dom";

const ProfitAndLoss = () => {
    const filters = useSelector((state: RootState) => state.report);
    const { type } = useParams<{ type: allowedreports }>();
    const { data: reportData, isLoading, refetch ,error} = useQuery<ReportData, Error, ReportData>({
        queryKey: ['profit-and-loss-month', type, filters.reportPeriod,filters.toDate,filters.fromDate,filters.customerId],
        queryFn: async () => {
            const response = await apiService.getReport({  fromDate: filters.fromDate, toDate: filters.toDate,type:"profit-and-loss",allowedType:"month" });
            return response.data || {
                Income: {
                    _id: 'income',
                    data: [],
                    total: 0
                },
                COGS: {
                    _id: 'cogs',
                    data: [],
                    total: 0
                },
                'Gross Profit': 0,
                Expense: {
                    _id: 'expense',
                    data: [],
                    total: 0
                },
                'Net Operating Income': 0,
                'Other Income': {
                    _id: 'other-income',
                    data: [],
                    total: 0
                },
                'Other Expense': {
                    _id: 'other-expense',
                    data: [],
                    total: 0
                },
                'Net Other Income': 0,
                'Net Profit': 0
           }
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
                {reportData && <ProfitAndLossCard reportData={reportData} />}
            </Box>
    );
};

export default withPermission("view",["accounting"])(ProfitAndLoss);