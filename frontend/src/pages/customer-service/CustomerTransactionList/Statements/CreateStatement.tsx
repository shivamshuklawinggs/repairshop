import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box, Button, Stack, Link, Chip, } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import apiService from '@/service/apiService';
import { addressformat, formatCurrency } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { paths } from '@/utils/paths';
import { IStatements } from '@/types';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CloseIcon from '@mui/icons-material/Close';
import CustomDatePicker from '@/components/common/CommonDatePicker';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreateStatementModal: React.FC<Props> = ({ open, onClose }) => {
  const { id } = useParams<{ id: string }>();

  const [dateFilter, setDateFilter] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ startDate: undefined, endDate: undefined });

  const hasRange = Boolean(dateFilter.startDate || dateFilter.endDate);

  const {
    data: invoiceData,
    refetch,
    isFetching,
  } = useQuery<IStatements, Error>({
    queryKey: ['getStatementsByCustomerId', id, dateFilter.startDate, dateFilter.endDate],
    queryFn: async () => {
      const params: { startDate?: Date; endDate?: Date } = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      const response = await apiService.generateStatementsByCustomerId(id!, params);
      return response.data;
    },
    enabled: Boolean(id),
  });

  const {
    mutate: createStatementMutation,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async () => {
      if (!invoiceData || !invoiceData.data?.length) {
        toast.error('No data found');
        throw new Error('No invoice data to send');
      }
      const res = await apiService.createStatements({
        data: invoiceData.data,
        customerId: id!,
        account: invoiceData.customer?.account ?? false,
        totalBalance: invoiceData.customer?.totalBalance ?? 0,
        totalRecievedAmount: invoiceData.customer?.totalRecievedAmount ?? 0,
        totalBalanceDue: invoiceData.customer?.totalBalanceDue ?? 0,
      },{
        startDate:dateFilter.startDate,
        endDate:dateFilter.endDate,
        customerId:id!
      });
      return res;
    },
    onSuccess: (res) => toast.success(res?.message || 'Statement sent successfully'),
    onError: (err: any) => toast.error(err?.message || 'Failed to create statement'),
  });

  const formattedRange = useMemo(() => {
    if (!hasRange) return '';
    if(dateFilter.startDate && dateFilter.endDate){
      return `${formatDate(dateFilter.startDate)} - ${formatDate(dateFilter.endDate)}`;
    }
    if(dateFilter.startDate){
      return `${formatDate(dateFilter.startDate)} - ${formatDate(new Date())}`;
    }
    if(dateFilter.endDate){
      return `${formatDate(new Date())} - ${formatDate(dateFilter.endDate)}`;
    }
    return '';
  }, [dateFilter, hasRange]);

  const handleClearFilter = () => {
    setDateFilter({ startDate: undefined, endDate: undefined });
  };
  const handleDateChange=(field:"startDate" |"endDate")=> (e: any) => {
    const value = e.target.value || undefined;
    setDateFilter((prev) => ({ ...prev, [field]: value }))
  };
  return (
    <AppDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogActions className='dialog-close'>
        <Button onClick={onClose}>
          {getIcon('CloseIcon')}
        </Button>
      </DialogActions>
      <DialogTitle>
        <Typography fontSize={15.5} sx={{borderBottom:'1px solid #ddd', pb:1.2, mb:1, fontWeight:'600'}}>{invoiceData?.customer?.company || 'Customer Statement'}</Typography>
      </DialogTitle>

      <DialogContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={3} mb={2}>
          {/* Billing Info */}
          <Box sx={{ width: {xs:'100%', md:'50%'} }}>
            <Typography variant="subtitle2" color='text.secondary' fontWeight="500">Billing Address</Typography>

            <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, borderRadius:0.5, border:'1px solid #ddd'}}>
              <Typography variant="body2" fontWeight={600}>{invoiceData?.customer?.company}</Typography>
              <Typography variant="body2" sx={{minHeight:'50px'}}>
                {addressformat({ billingAddress: invoiceData?.customer?.billingAddress || { address: '', city: '', state: '', zipCode: '', country: '' } })}
              </Typography>
            </Paper>

          </Box>

          {/* Balance & Date Filter */}
          <Box sx={{ width: {xs:'100%', md:'50%'} }}>
            <Typography variant="subtitle2" fontWeight="bold">Balance Due</Typography>
            <Typography variant="h5" color="error">
              {formatCurrency(invoiceData?.customer?.totalBalanceDue ?? 0)}
            </Typography>

              <Stack direction="row" spacing={1.5} mt={1.5} alignItems="center">
                <CustomDatePicker
                  label="Start"
                  value={dateFilter.startDate}
                  onChange={handleDateChange("startDate")}
                  name='startDate'
                  size='small'
                />
               <CustomDatePicker
                  label="End"
                  value={dateFilter.endDate}
                  onChange={handleDateChange("endDate")}
                  name='endDate'
                  size='small'
                />

                {/* {hasRange && (
                  <Chip
                  sx={{
                  border: '1px solid #ddd',
                  '& .MuiChip-deleteIcon': {
                    color: '#333',        // close icon color
                    '&:hover': {
                      color: '#333'       // hover color
                    }
                  }
                }}
                    label={formattedRange}
                    onDelete={handleClearFilter}
                    deleteIcon={<CloseIcon fontSize="small"/>}
                    size="small"
                  />
                )} */}

                {/* {
                  hasRange && (
                    <Button
                    variant="contained"
                    size="small"
                    sx={{
                      borderRadius:2,
                      py:0,
                    }}
                    onClick={() => refetch()} disabled={!hasRange || isFetching}>
                      Apply
                    </Button>
                  )
                } */}
              </Stack>

          </Box>
        </Stack>

        {/* Invoice Table */}
        <TableContainer sx={{mt:3}}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{whiteSpace:'nowrap'}}>Date</TableCell>
                <TableCell sx={{whiteSpace:'nowrap'}}>Activity</TableCell>
                <TableCell sx={{whiteSpace:'nowrap'}}>Open Amount</TableCell>
                <TableCell sx={{whiteSpace:'nowrap'}}>Paid Amount</TableCell>
                <TableCell sx={{whiteSpace:'nowrap'}}>Balance Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!invoiceData?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{py:2}}>
                    {isFetching ? 'Loading...' : 'No records found'}
                  </TableCell>
                </TableRow>
              ) : (
                invoiceData.data.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell sx={{whiteSpace:'nowrap'}}>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell sx={{whiteSpace:'nowrap'}}>
                      <Link href={paths.base64imageviewer+"/invoices/"+inv?._id} target="_blank" underline="hover">
                        Invoice #{inv.invoiceNumber}: Due {formatDate(inv.dueDate)}
                      </Link>
                    </TableCell>
                    <TableCell sx={{whiteSpace:'nowrap'}}>{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell sx={{whiteSpace:'nowrap'}}>{formatCurrency(inv.recievedAmount)}</TableCell>
                    <TableCell sx={{whiteSpace:'nowrap'}}>{formatCurrency(inv.balanceDue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{px:3, pb:2, pt:0}}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        {/* <Button variant="outlined">Print / Preview</Button>
        <Button variant="outlined" color="error">Delete</Button> */}
        <Button
          variant="contained"
          onClick={() => createStatementMutation()}
          disabled={isCreating}
        >
          {isCreating ? <LoadingSpinner size={16} /> : 'Send'}
        </Button>
        {createError && (
          <Typography color="error" variant="caption" sx={{ ml: 2 }}>
            {createError.message}
          </Typography>
        )}
      </DialogActions>
    </AppDialog>
  );
};

export default CreateStatementModal;
