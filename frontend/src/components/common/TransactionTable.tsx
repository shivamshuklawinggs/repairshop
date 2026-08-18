import React, { useState } from 'react'
import { TableRow, TableCell, Stack, Chip, IconButton, Box } from '@mui/material'
import { ICustomerInvoicesPaymentDetails, ReferenceType, TransactionType } from '@/types';
import { formatCurrency, formatDebitCredit } from '@/utils';
import GetStatus from './GetStatus';
import { formatDate } from '@/utils/dateUtils';
import { paths } from '@/utils/paths';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import VerticalMenu from '@/components/VerticalMenu';
import { useTransactionMenuActions } from '@/shared/useTransactionMenuActions';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { downloadInvoicePdf } from '@/utils/downloadInvoicePdf';
import InvoiceDetailsModal from '@/pages/invoice-service/InvoiceDetailsModal';
import InvoiceEmailReminders from '@/pages/invoice-service/InvoiceEmailReminders';
import { toast } from 'react-toastify';
const TransactionTable: React.FC<{
  transaction: ICustomerInvoicesPaymentDetails,
  index: number,
}> = ({ transaction, index }) => {
  const navigate = useNavigate();
  const { id } = useParams()
  const queryClient = useQueryClient()
  const user = useSelector((state: RootState) => state.user)
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  // payment delete mutation
  const { mutate: deletePayment, isPending: isDeletingPayment
  } = useMutation({
    mutationFn: (id: string) =>
      apiService.deleteRecivedPayment(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['getTransactionsByCustomerId', id] });
      queryClient.invalidateQueries({ queryKey: ['TotalTransactionCount', id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete Invoices');
    },
  });
  const deleteInvoiceMutation = useMutation({
    mutationFn: (InvoicesId: string) => apiService.deleteAccountInvoice(InvoicesId),
    onSuccess: () => {
      toast.success('Invoices deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['getTransactionsByCustomerId', id] });
      queryClient.invalidateQueries({ queryKey: ['TotalTransactionCount', id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete Invoices');
    },
  });
  const deleteBillMutation = useMutation({
    mutationFn: (InvoicesId: string) => apiService.deleteAccountBill(InvoicesId),
    onSuccess: () => {
      toast.success('bill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['getTransactionsByCustomerId', id] });
      queryClient.invalidateQueries({ queryKey: ['TotalTransactionCount', id] });
    },
    onError: (error: any) => {

      toast.error(error.message || 'Failed to delete bil');
    },
  });
  const deleteJournalEntryMutation = useMutation({
    mutationFn: (InvoicesId: string) => apiService.deleteJournalEntry(InvoicesId),
    onSuccess: () => {
      toast.success('Journal Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['getTransactionsByCustomerId', id] });
      queryClient.invalidateQueries({ queryKey: ['TotalTransactionCount', id] });
    },
    onError: (error: any) => {

      toast.error(error.message || 'Failed to delete Journal Entry');
    },
  });
 const handleEdit = (transaction: ICustomerInvoicesPaymentDetails) => {
  try {
    switch (transaction.type) {
      case ReferenceType.JOURNAL_ENTRY:
        navigate(`/accounting${paths.JournalEntry}/${transaction.referenceId}`);
        break;

      case ReferenceType.INVOICE_PAYMENT:
        navigate(`${paths.recievedpayment}/${transaction.referenceId}`);
        break;

      case ReferenceType.BILL_PAYMENT:
        navigate(`${paths.recievedbill}/${transaction.referenceId}`);
        break;

      case ReferenceType.INVOICE:
      case ReferenceType.SALES_TAX:
      case ReferenceType.SALES_DISCOUNT:
        navigate(`${paths.editinvoice}/${transaction.referenceId}`);
        break;

      case ReferenceType.BILL:
      case ReferenceType.PURCHASE_TAX:
      case ReferenceType.PURCHASE_DISCOUNT:
        navigate(`${paths.editbill}/${transaction.referenceId}`);
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(error);
  }
};

const handleDelete = (transaction: ICustomerInvoicesPaymentDetails) => {
  try {
    const isDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!isDelete) return;

    switch (transaction.type) {
      case ReferenceType.JOURNAL_ENTRY:
        deleteJournalEntryMutation.mutate(transaction.referenceId);
        break;

      case ReferenceType.INVOICE_PAYMENT:
      case ReferenceType.BILL_PAYMENT:
        deletePayment(transaction.referenceId);
        break;
        
      case ReferenceType.INVOICE:
      case ReferenceType.SALES_TAX:
      case ReferenceType.SALES_DISCOUNT:
        deleteInvoiceMutation.mutate(transaction.referenceId);
        break;

      case ReferenceType.BILL:
      case ReferenceType.PURCHASE_TAX:
      case ReferenceType.PURCHASE_DISCOUNT:
        deleteBillMutation.mutate(transaction.referenceId);
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(error);
  }
};

  const handleDeleteById = (id: string) => {
    handleDelete(transaction);
  };

  const handleViewDetails = (item: ICustomerInvoicesPaymentDetails) => {
    // Open details modal based on transaction type
    if (item.transactionType === TransactionType.INVOICE) {
      setDetailsInvoiceId(item.referenceId);
      setShowDetailsModal(true);
      return
    }
    if (item.type === ReferenceType.BILL ||
      item.type === ReferenceType.PURCHASE_TAX ||
      item.type === ReferenceType.PURCHASE_DISCOUNT) {
      navigate(`${paths.accountpayable}/${item.referenceId}`);
      return
    } else if (item.type === ReferenceType.INVOICE_PAYMENT) {
      navigate(`${paths.recievedpayment}/${item.referenceId}`);
      return
    } else if (item.type === ReferenceType.BILL_PAYMENT) {
      navigate(`${paths.recievedbill}/${item.referenceId}`);
      return
    } else if (item.type === ReferenceType.JOURNAL_ENTRY) {
      navigate(`${paths.JournalEntry}/${item.referenceId}`);
      return
    }
  };

  const handleDownload = (item: ICustomerInvoicesPaymentDetails) => {
    if (item.transactionType === TransactionType.INVOICE) {
      downloadInvoicePdf({
        invoiceId: item.referenceId,
        setLoading: setPdfLoading,
      });
    }
  };

  const handleSendReminder = (item: ICustomerInvoicesPaymentDetails) => {
    // Only for invoices
    if (item.transactionType === TransactionType.INVOICE) {
      setSelectedInvoiceId(item.referenceId);
      setShowReminderModal(true);
    }
  };
  const getTransactionMemo = (transaction: ICustomerInvoicesPaymentDetails) => {
    return transaction?.description;
  };
  return (
    <>
      <TableRow key={`${transaction._id}-${index}`}>
        <TableCell align='center'>{index + 1}</TableCell>
        <TableCell>
          {transaction?.postingDate
            ? formatDate(transaction?.postingDate)
            : "N/A"}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0 }}>
            <Chip
              label={transaction.refrenceNo}
              size="small"
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                height: 'auto',
                width: 'fit-content',
                backgroundColor: 'transparent',
                mb: 0,
                lineHeight: '1.1',
                '& .MuiChip-label': {
                  pr: 1,
                  pl: 0,
                }
              }}
            />
            <Chip
              label={transaction.type}
              size="small"
              color="primary"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 'auto',
                width: 'fit-content',
                lineHeight: '1.35'
              }}
            />
          </Box>
        </TableCell>

        <TableCell title={transaction?.party} className='tellipsis'>{transaction?.party}</TableCell>

        <TableCell title={getTransactionMemo(transaction)} className='tellipsis'>{getTransactionMemo(transaction)}</TableCell>

        <TableCell>
          {formatCurrency(transaction.debit)}
        </TableCell>

        <TableCell>
          {formatCurrency(transaction.credit)}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {formatDebitCredit(transaction?.balanceDuenumeric ?? 0)}
        </TableCell>
        <TableCell align='center'>
          <GetStatus invoice={transaction} />
        </TableCell>
        <TableCell align="center">
          <VerticalMenu
            actions={useTransactionMenuActions({
              type: transaction.transactionType,
              item: { ...transaction, balanceDue: transaction?.summary.balanceDue ?? 0 },
              user,
              navigate,
              pdfLoading,
              onViewDetails: handleViewDetails,
              onEdit: handleEdit,
              onDelete: handleDeleteById,
              onDownload: handleDownload,
              onSendReminder: handleSendReminder,
              // Configure menu options based on transaction type
              showViewDetails: true,
              showDownload: transaction.transactionType === TransactionType.INVOICE,
              showEdit: transaction.transactionType !== TransactionType.PAYMENT,
              showDelete: true,
              showPayment: transaction.transactionType !== TransactionType.PAYMENT,
              showReminder: transaction.transactionType === TransactionType.INVOICE,
            })}
          />
        </TableCell>
      </TableRow>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsInvoiceId('');
        }}
        invoiceId={detailsInvoiceId}
      />

      {/* Invoice Email Reminder Modal */}
      <InvoiceEmailReminders
        open={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setSelectedInvoiceId('');
        }}
        invoiceId={selectedInvoiceId}
      />
    </>
  )
}

export default TransactionTable