import { ICarrier, ICustomer } from '@/types';
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form';
import {
  TextField,
  Grid,
  InputAdornment,
  Box,
} from '@mui/material';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useUSDOTForCarrier, useGetUsDotDataForCustomer } from '@/hooks/useGetUsDotData';
import { Search as FaSearch } from '@mui/icons-material';
import { EntityType } from '@/components/common/UniversalEntityForm';
const UsDotField:React.FC<{setLocalUsdot:any,entity:EntityType}> = ({setLocalUsdot,entity}) => {
   
    const form = useFormContext<ICarrier | ICustomer>(); 
    // Use appropriate hook based on entity type
      const carrierHook =  useUSDOTForCarrier(form.setValue) ;
      const customerHook = useGetUsDotDataForCustomer(form.setValue)
    
      const { loading: usdotLoading, error: usdotError, handleSubmit: searchUSDOT } = entity === 'vendor' ? carrierHook : customerHook;
       const handleUSDOTSearch = () => {
    const usdotValue = form.watch('usdot');
    if (usdotValue) {
      searchUSDOT(usdotValue);
      setLocalUsdot?.(usdotValue);
    }
  };
  console.log("usdotError",usdotError)
    return <Grid item xs={12} md={4}>
        <Controller
            name="usdot"
            control={form.control}
            render={({ field }) => (
                <TextField
                    {...field}
                    fullWidth
                    label="USDOT"
                    size="small"
                    error={!!form.formState.errors.usdot || !! usdotError}
                    helperText={form.formState.errors.usdot?.message || usdotError?.message}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <FaSearch
                                    onClick={handleUSDOTSearch}
                                    style={{ cursor: 'pointer', color: '#1976d2' }}
                                />
                                {usdotLoading && <LoadingSpinner />}
                            </InputAdornment>
                        ),
                    }}
                />
            )}
        />
      
    </Grid>

}

export default UsDotField