import { FormControl,InputLabel,MenuItem,Select,FormHelperText } from '@mui/material';
import { useFormContext,Controller } from 'react-hook-form';
import { FC } from 'react';
import {  ICustomer ,IInvoice} from '@/types';
import apiService from '@/service/apiService';
import { useQuery } from '@tanstack/react-query';
const CustomerSelect:FC<{openCustomerModal: () => void;}> = ({openCustomerModal}) => {
    const form=useFormContext<IInvoice>();
const { data: customers = [] } = useQuery({
  queryKey: ["accountsCustomerInvoice"],
  queryFn: async () => {
    let page = 1;
    let limit = 10;
    let hasMore = true;
    let allData: ICustomer[] = [];

    while (hasMore) {
      const response = await apiService.getAccountsCustomers({ page, limit });

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
    Customer Name
    </InputLabel>
     <Controller
     name="customerId"
     control={form.control}
     render={({field})=>(
      <Select
      {...field}
      value={form.watch("customerId")}
      label="Customer Name"
      disabled={!form.watch("invoiceNumber") || !!form.watch("_id")}
      error={!!form.formState.errors.customerId}
    >
       <MenuItem key={""} value={""} onClick={openCustomerModal}>
         + Create New Customer
       </MenuItem>
      {customers.map((customer) => (
        <MenuItem key={customer._id} value={customer._id}>
          {customer?.company || customer?.company || 'No company name'}
        </MenuItem>
      ))}
    </Select>
     )}
     />
       {
         form.formState.errors.customerId && <FormHelperText>{form.formState.errors.customerId.message}</FormHelperText>
       }
  </FormControl>
  )
}

export default CustomerSelect