import  { FC,useEffect } from 'react';
import {  Paper, Typography, TextField, Box, InputAdornment } from '@mui/material';
import { formatCurrency} from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { useFormContext } from 'react-hook-form';
import { IInvoice } from '@/types';
import apiService from '@/service/apiService';
import { calculateInvoiceSummary } from '@/utils/calculateInvoiceAndBillSummary';
import { useQuery } from '@tanstack/react-query';
import { Edit } from '@mui/icons-material';
import { paths } from '@/utils/paths';
import { useNavigate } from 'react-router-dom';
import { NumericInput } from '@/components/ui';
const TotalsSection:FC<{handleTaxModalShow:()=>void}> = ({handleTaxModalShow}) => {
  const navigate=useNavigate();
  const form=useFormContext<IInvoice>();
  const fetchTaxOptions = async () => {
    try {
      const response = await apiService.getSalesTax();
      form.setValue("taxArray",response.data);
      return response.data;
    } catch (error) {
      form.setValue("taxArray",[]);
      return []
    }
  };
  useQuery({
    queryKey: ['taxOptions'],
    queryFn: fetchTaxOptions,
  });
    const fieldsToWatch = [
      'discountPercent',
      'expense',
      'type',
      'tax',
      'taxArray'
    ];
    const values = form.watch(fieldsToWatch as any, { deep: true });
    useEffect(() => {
      calculateInvoiceSummary(form);
    }, [...values]);
  return (
    <Paper sx={{ p: 0, borderRadius:0 }} elevation={0}>
    {[
   
      {
        label: 'Subtotal',
        value:form.watch("subTotal")? `$${form.watch("subTotal")?.toFixed(2)}` : "",
      },
    ].map((item, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography fontSize={15} fontWeight={500}>{item.label}</Typography>
        <Typography fontWeight={600}>{item.value}</Typography>
      </Box>
    ))}

    {/* Discount Percent */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0.5,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography fontSize={15} fontWeight={600} sx={{ mr: 1.5 }}>
          Discount
        </Typography>
        <NumericInput size='small'
          MAX_LIMIT={100}
          value={form.watch('discountPercent')}
          onChange={(e) =>
            form.setValue('discountPercent', e ?? 0)
          }
          sx={{
              width: 85,
               "& .MuiOutlinedInput-root": {
                height: 30,
              },
              '& .MuiInputBase-input': {
                padding: '5.5px 5px', // top-bottom left-right
                fontSize: '14px',
              },
              '& .MuiInputAdornment-root': {
                marginLeft:'2px',
              },
            }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
            inputProps: {
              min: 0,
              max: 100,
            },
          }}
        />
      </Box>
      <Typography fontWeight={600}>
        {formatCurrency(form.watch("totalDiscount") || 0)}
      </Typography>
    </Box>
    {/* Tax */}

    {/* Total */}
       {/* Tax */}
       <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography fontSize={15} fontWeight={500}>Tax</Typography>
          {/* <FormControl size='small'>
            <Controller
              name="tax"
              control={form.control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="small"
                  sx={{ width: 100 }}
                >
                  <MenuItem value="">Select Tax</MenuItem>
                  <MenuItem value="" onClick={handleTaxModalShow}>Add New Tax</MenuItem>
                  {form.watch("taxArray")?.map((option: ITaxOption) => (
                    <MenuItem key={option._id} value={option._id}>
                      {option.value + "%"}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl> */}
        </Box>
        <Typography fontWeight={600}>
          {formatCurrency(form.watch("taxAmount") || 0)}
        </Typography>
      </Box>
    {/* Total */}
    <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography fontSize={15} fontWeight={500}>Total</Typography>
        <Typography fontWeight={600}>
          {formatCurrency(form.watch("total") || 0)}
        </Typography>
      </Box>
   {/* Recieved Payment */}

      {
        form.watch("recievedPaymentAmount")?.map((payment,index)=>(
          <Box
          key={index}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography fontSize={15} fontWeight={500} sx={{display:'flex',alignItems:'center'}} > Payment On {formatDate(payment.paymentDate)} <Edit fontSize='small' onClick={()=>navigate(`${paths.recievedpayment}/${payment._id}`)}/></Typography>
          <Typography fontWeight={600} color='primary'> {formatCurrency(payment.amount)}</Typography>
          </Box>
        ))
      }
    {/* Balance Due */}
    {/* <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography fontWeight={700}>Balance Due</Typography>
      <Typography fontWeight={700}>
        {formatCurrency(form.watch("balanceDue") || 0)}
      </Typography>
    </Box> */}

  </Paper>


  );
};

export default TotalsSection;