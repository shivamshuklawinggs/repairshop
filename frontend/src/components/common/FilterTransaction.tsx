import React from 'react'
import { Box, FormControl, InputLabel, MenuItem, Select, Button } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { downloadCSV } from '@/utils';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HasPermission } from '@/hooks/authUtils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getIcon } from './icons/getIcon';
import { ITotalTransactionCount } from '@/types';
interface FilterTransactionProps {
  years:ITotalTransactionCount["years"],
  selectedYear: number,
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>,
  totalLoaded: number,
  totalRecords: number,
  type: "vendor" | "customer"
}
const FilterTransaction: React.FC<FilterTransactionProps> = ({ selectedYear, setSelectedYear, totalLoaded, totalRecords, years, type }) => {
  const { id } = useParams()
  const exportCustomersMutation = useMutation({
    mutationFn: () => apiService.exportTransactionyCustomerId(id as string, type),
    onSuccess: (data) => {
      downloadCSV(data.data);
      toast.success('Customers exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export customers');
    },
  });
  const handleExportData = async () => {
    exportCustomersMutation.mutate();
  }

  return (
    <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
      {
        Array.isArray(years) && years.length>0 && 
        <>
      <FormControl size='small' sx={{ minWidth: 120 }} >
        <InputLabel>Year</InputLabel>
        <Select
          value={selectedYear}
          label="Year"
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {Array.isArray(years) && years.map((year) => (
            <MenuItem key={year._id} value={year._id}>{year._id}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <HasPermission action="export" resource={['accounting']} component={<Button
        variant="outlined"
        sx={{px:1, py:0.3, minWidth:'auto', borderRadius:'6px', borderColor:'#ddd'}}
        onClick={handleExportData}
        disabled={exportCustomersMutation.isPending}
      >
        {exportCustomersMutation.isPending ? <LoadingSpinner size={24} /> :getIcon("fileExport", { sx: { fontSize: 20} })}
      </Button>} />
        </>
      }

    </Box>
  )
}

export default FilterTransaction