
import { useQuery } from "@tanstack/react-query";
import { allowedreports, BalanceSheetData } from "@/types";
import BalanceSheetCard from "./BalanceSheetCard";
import apiService from "@/service/apiService";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import FilterBar from '../FilterBar';
import { Box, CircularProgress} from "@mui/material";
import { withPermission } from '@/hooks/authUtils';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import ExportButtons from "../ExportButtons";
import { useParams } from "react-router-dom";
const BalanceSheet = () => {
    const filters = useSelector((state: RootState) => state.report);
    const {type="balance-sheet"}=useParams<{type:allowedreports}>()
    const { data: reportData, isLoading, refetch,error } = useQuery<BalanceSheetData, Error, BalanceSheetData>({
        queryKey: [type, filters.reportPeriod,filters.toDate,filters.fromDate,filters.customerId],
        queryFn: async () => {
            const response = await apiService.getReport({ fromDate: filters.fromDate, toDate: filters.toDate,type:"balance-sheet" });
            return response.data;
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
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Balance Sheet</Typography>
                    <Box>
                        <Button>Save As</Button>
                    </Box>
                </Box> */}
                <ErrorHandlerAlert error={error}/>
                <FilterBar onApplyFilters={handleApplyFilters} />
                {reportData && <BalanceSheetCard reportData={reportData} />}
            </Box>
    );
};

export default withPermission("view",["accounting"])(BalanceSheet);
