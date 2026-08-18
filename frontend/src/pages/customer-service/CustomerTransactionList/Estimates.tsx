import React from 'react'
import { Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Link, Chip, Box } from '@mui/material'
import { ICustomerInvoicesPaymentDetails } from '@/types';
import { formatCurrency, invoiceStatusColor } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { paths } from '@/utils/paths';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { useParams } from 'react-router-dom';
import VerticalMenu from '@/components/VerticalMenu';
import { toast } from 'react-toastify';
import { DataTable } from '@/components/ui';
const Estimates: React.FC = () => {
    const queryClient = useQueryClient()
    const { id } = useParams()

    const { data: invoiceData } = useQuery({
        queryKey: ['getEstimatesByCustomerId', id],
        queryFn: async () => {
            const response = await apiService.getEstimatesByCustomerId(id as string)
            return response;
        },
        enabled: !!id,
    });

    const convertEstimateToInvoiceMutation = useMutation({
        mutationFn: (id: string) => apiService.convertEstimateToInvoice(id),
        onSuccess: (response) => {
            toast.success(response?.message || 'Estimate converted to invoice successfully');
            queryClient.invalidateQueries({ queryKey: ['getEstimatesByCustomerId'] });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to convert estimate to invoice');
        }
    });

    const handleConvertEstimateToInvoice = (id: string) => {
        convertEstimateToInvoiceMutation.mutate(id);
    }
    function onRowsPerPageChange(rows: number): void {
        throw new Error('Function not implemented.');
    }
const renderRow = (invoice:any) => (
            <TableRow key={invoice._id}>
                <TableCell sx={{whiteSpace:'nowrap'}}>
                    <Typography sx={{ fontSize: { xs: '13px', md: '14px' }, fontWeight: '500' }}
                    >
                        <Link href={paths.base64estimateviewer + "/" + invoice._id} target="_blank"># {invoice.invoiceNumber}{' '}
                        </Link>
                        <span>{formatDate(invoice.dueDate)}</span>
                    </Typography>
                </TableCell>
                <TableCell>{formatCurrency(invoice.totalAmountWithTax)}</TableCell>
                <TableCell align='center'>
                    <Chip label={invoice.status}
                        sx={{
                            backgroundColor: invoiceStatusColor(invoice.status),
                            color: '#fff',
                            height: 'auto',
                            fontSize: '12px'
                        }} />
                </TableCell>
                <TableCell align='center'>
                    <VerticalMenu actions={[
                        // {
                        //     label: "Edit",
                        //     icon: <EditIcon />,
                        //     onClick: () => handleEdit(invoice._id)
                        // },
                        {
                            label: "Convert to Invoice",
                            icon: "delete",
                            onClick: () => handleConvertEstimateToInvoice(invoice._id)
                        }
                    ]} />
                </TableCell>
            </TableRow>
  );
    return (
        <Box
            sx={{
                '& .MuiPaper-root': {
                mt: 0,
                },
            }}
        >
        <DataTable
            columns={[
                { key: "Descriptions", label: "Descriptions" },
                { key: "Amount", label: "Amount" },
                { key: "status", label: "Status", align:"center" },
                { key: "action", label: "Action", align:"center" },
            ]}
            data={invoiceData?.data?.data || []}
            onRowsPerPageChange={onRowsPerPageChange}
            renderRow={renderRow}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
      </Box>
    )
}

export default Estimates