import { FormControl,InputLabel,MenuItem,Select,FormHelperText } from '@mui/material';
import { useFormContext,Controller } from 'react-hook-form';
import { ICarrier, IVendorBill } from '@/types';
import { FC } from 'react';
import apiService from '@/service/apiService';
import { useQuery } from '@tanstack/react-query';
const CustomerSelect:FC<{openCustomerModal:()=>void}> = ({openCustomerModal}) => {

    const form=useFormContext<IVendorBill>();
const { data: customers = [] } = useQuery({
  queryKey: ["accountsCustomerBills"],
  queryFn: async () => {
    let page = 1;
    let limit = 10;
    let hasMore = true;
    let allData: ICarrier[] = [];

    while (hasMore) {
      const response = await apiService.getVendors({ page, limit });

      if (!response.data || response.data.length < limit) {
        hasMore = false;
      }

      if (response.data) {
        allData.push(...response.data);
      }

      page += 1;
    }

    return allData;
  },
});



  return (
    <FormControl size='small' fullWidth >
    <InputLabel id="customer-select-label">
    Vendor Name
    </InputLabel>
     <Controller
     name="vendorId"
     control={form.control}
     render={({field})=>(
      <Select
      {...field}
      label="Vendor Name"
      error={!!form.formState.errors.vendorId}

    >
      <MenuItem value="" onClick={openCustomerModal}>Create New Vendor</MenuItem>
      {customers?.map((customer:ICarrier,index:number) => (
        <MenuItem key={customer._id || index } value={customer._id || index }>
          {customer?.company || customer?.company || 'No company name'}
        </MenuItem>
      ))}
    </Select>

     )}
     />
  {form.formState.errors.vendorId &&  <FormHelperText error={!!form.formState.errors.vendorId}>{form.formState.errors.vendorId?.message}</FormHelperText>}
  </FormControl>
  )
}

export default CustomerSelect