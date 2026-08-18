import React, { useMemo } from 'react';
import { Typography, TableContainer, Box, Table, TableHead, TableRow, TableCell, TableBody, Stack, Chip, Divider, Card, CardContent, IconButton, TextField } from '@mui/material';
import { formatCurrency, calculateTotalRecievedAmount } from '@/utils';
import { Receipt, Delete } from '@mui/icons-material';
import { useFormContext } from 'react-hook-form';
import { useCreditLeft } from '../hooks/useCreditLeft';
import { useAmountApplied } from '../hooks/useAmountApplied';
import { UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';
interface UpdateRecievepaymentProps {
  isLoading: boolean;
  documentLabel?: string;
  nonRecievedPayments?: any[];
}

const UpdateRecievepayment: React.FC<UpdateRecievepaymentProps> = ({ isLoading, documentLabel = 'Bill', nonRecievedPayments = [] }) => {
  const { setValue, watch } = useFormContext<UpdateRecievedPamentSchemaType>();
  const recievedPayments = watch('recievedPayments') || [];
  const deletedPayments = watch('deletedPayments') || [];
  const creditLeft = useCreditLeft();
  const amountApplied = useAmountApplied();

  const totalDueAmount = useMemo(() => {
    return (invoiceId: string, totalAmountWithTax: number = 0) => {
      const totalRecievedAmount = calculateTotalRecievedAmount(recievedPayments, invoiceId, nonRecievedPayments) || 0;
      return totalAmountWithTax - totalRecievedAmount;
    };
  }, [recievedPayments, nonRecievedPayments]);

  const handleDelete = (paymentToDelete: any) => {
    const updatedDeletedPayments = [...deletedPayments, paymentToDelete];
    setValue('deletedPayments', updatedDeletedPayments, { shouldValidate: true });

    const updatedRecievedPayments = recievedPayments.filter((item: any) => {
      if (item._id && paymentToDelete._id) {
        return item._id !== paymentToDelete._id;
      }
      return (
        item.invoiceId !== paymentToDelete.invoiceId ||
        item.amount !== paymentToDelete.amount
      );
    });

    setValue('recievedPayments', updatedRecievedPayments as any, { shouldValidate: true });
  };

  const handleAmountChange = (index: number, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const amount = parseFloat(value) || 0;
      const updatedPayments = [...recievedPayments];
      updatedPayments[index] = { ...updatedPayments[index], amount };
      setValue('recievedPayments', updatedPayments, { shouldValidate: true });
    }
  };

  return (
    <Box>
      {recievedPayments.map((payment, index) => {
        const invoiceId = payment.invoiceId;
        const invoicePayments = recievedPayments.filter(p => p.invoiceId === invoiceId);
        const isFirstPayment = invoicePayments.findIndex(p => p === payment) === 0;

        return (
          <Card elevation={0}
            key={`${invoiceId}-${index}`}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.5,
              overflow: 'auto',
              mt: 2,
              boxShadow:'none',
            }}
          >
            {isFirstPayment && (
              <CardContent sx={{ p: 0 }} style={{ paddingBottom: '0px' }}>
                <Box sx={{ px: 1.5, py: {xs:2, md:0.3} }}>
                  <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "start", md: "center" }} spacing={1} justifyContent={'space-between'}>
                    <Box sx={{ display:'flex', gap: 1, alignItems: 'center' }}>
                      <Receipt sx={{ fontSize: {xs:15, md:18} }} />
                      <Typography fontSize={{xs:12, md:14}} sx={{ fontWeight: 600, mb: 0, whiteSpace:'nowrap' }}>
                        {documentLabel} #{payment.invoiceNumber || invoiceId}
                      </Typography>
                      <Chip
                        color='success'
                        label={`${invoicePayments.length} Payment${invoicePayments.length > 1 ? 's' : ''}`}
                        sx={{
                          fontWeight: 600,
                          py: 0.2,
                          fontSize: '12px',
                          height: 'auto',
                          px: 0,
                          ml: 1,
                          scale: '0.9',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>

                    <Box sx={{ display:'flex', gap: {xs:1, md:4}, alignItems: 'center'}}>
                      <Box>
                        <Typography variant="caption" color='text.secondary' sx={{ mb: 0, whiteSpace:'nowrap' }}>Total Amount</Typography>
                        <Typography fontSize={{xs:14, md:16}} sx={{ fontWeight: 600 }}>{formatCurrency(payment.totalAmountWithTax || 0)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color='text.secondary' sx={{ mb: 0, whiteSpace:'nowrap' }}>Total Received Amount</Typography>
                        <Typography fontSize={{xs:14, md:16}} sx={{ fontWeight: 600 }}>{formatCurrency(calculateTotalRecievedAmount(recievedPayments, invoiceId, nonRecievedPayments))}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color='text.secondary' sx={{ mb: 0, whiteSpace:'nowrap' }}>Balance Due</Typography>
                        <Typography fontSize={{xs:14, md:16}} sx={{ fontWeight: 600 }}>{formatCurrency(totalDueAmount(invoiceId, payment.totalAmountWithTax || 0))}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '35%' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize={{xs:13, md:13.6}} fontWeight={600} sx={{whiteSpace:'nowrap'}}>Original Amount</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '30%' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize={{xs:13, md:13.6}} fontWeight={600} sx={{whiteSpace:'nowrap'}}>Amount to Apply</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '35%' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize={{xs:13, md:13.6}} fontWeight={600} sx={{whiteSpace:'nowrap'}}>Action</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography fontSize={{xs:14, md:15}} sx={{ fontWeight: 600 }}>{formatCurrency(Number(payment.OriginalAmount || 0))}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        value={payment.amount || ''}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        inputProps={{ inputMode: 'decimal' }}
                        disabled={isLoading}
                        sx={{
                          '& .MuiInputBase-input': {
                            padding: '5px 10px', // top-bottom left-right
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                      onClick={() => handleDelete(payment)}
                      size="small"
                      color="error"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'error.contrastText',
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                          },
                        }}
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        );
      })}

      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
        <CardContent sx={{ px:{xs:2, md:3}, py: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>Payment Summary</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: '15px' }}>Amount To Apply:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{formatCurrency(amountApplied || 0)}</Typography>
                </Box>
                <Divider sx={{ my: 0 }} style={{ marginTop: '10px' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} style={{ marginTop: '10px' }}>
                  <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: '15px' }}>Amount To Credit:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>{formatCurrency(Number(creditLeft) || 0)}</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UpdateRecievepayment;
