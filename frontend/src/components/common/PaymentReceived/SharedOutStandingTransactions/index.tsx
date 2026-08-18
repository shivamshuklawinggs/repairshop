import React, { useMemo } from 'react'
import { Typography, TableContainer, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Stack, Link } from '@mui/material'
import { ICustomerInvoicesPaymentDetails, IPaymentRecived } from '@/types';
import { formatCurrency } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { paths } from '@/utils/paths';
import { useFormContext } from 'react-hook-form';
import { UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';
import InvoiceAmount from './InvoiceAmount';

export type DocumentType = 'invoices' | 'bills';
export type FormContextType = 'IPaymentRecived' | 'UpdateRecievedPamentSchemaType' | 'none';

interface SharedOutStandingTransactionsProps {
  isLoading: boolean;
  documentType: DocumentType;
  showSummary?: boolean;
  customerInvoices?: ICustomerInvoicesPaymentDetails[];
  formContextType?: FormContextType;
  tableContainerSx?: any;
  renderAmountCell?: (invoice: any, index: number) => React.ReactNode;
}

const SharedOutStandingTransactions: React.FC<SharedOutStandingTransactionsProps> = ({
  isLoading,
  documentType,
  showSummary = true,
  customerInvoices: propInvoices,
  formContextType = 'IPaymentRecived',
  tableContainerSx = { borderRadius: 0.5, mt: 3 },
  renderAmountCell
}) => {
  const invoices = propInvoices || [];

  // Get form context based on type
  let invoicePayments: any[] = [];
  let amount = 0;

  if (formContextType === 'IPaymentRecived') {
    const { watch } = useFormContext<IPaymentRecived>();
    invoicePayments = watch('invoicePayments') || [];
    amount = watch('amount') || 0;
  } else if (formContextType === 'UpdateRecievedPamentSchemaType') {
    const { watch } = useFormContext<UpdateRecievedPamentSchemaType>();
    invoicePayments = watch('invoicePayments') || [];
    amount = watch('amount') || 0;
  }

  // Calculate summary if needed
  const totalSelectedAmount = useMemo(() => {
    if (!showSummary || formContextType === 'none') return 0;
    return invoicePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }, [invoicePayments, showSummary, formContextType]);

  const amountToCredit = useMemo(() => {
    if (!showSummary || formContextType === 'none') return 0;
    const credit = amount - totalSelectedAmount;
    return credit > 0 ? credit : 0;
  }, [amount, totalSelectedAmount, showSummary, formContextType]);

  const documentPath = documentType === 'invoices' ? '/invoices/' : '/bills/';

  return (
    <>
      <TableContainer sx={tableContainerSx}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                  Descriptions
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                  Due Date
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                  Original Amount
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                  Open Balance
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                  Amount to Apply
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice: any, index: number) => (
              <TableRow key={invoice?._id}>
                <TableCell>
                  <Typography fontSize={14} fontWeight={600} sx={{whiteSpace:'nowrap'}}>
                    <Link href={paths.base64imageviewer + documentPath + invoice?._id} target="_blank">
                      # {invoice?.invoiceNumber}{' '}
                    </Link>
                    <span>{formatDate(invoice?.dueDate)}</span>
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(invoice?.dueDate)}</TableCell>
                <TableCell>{formatCurrency(invoice?.totalAmountWithTax)}</TableCell>
                <TableCell>{formatCurrency(invoice?.balanceDue)}</TableCell>
                <TableCell sx={{ py: 1 }}>
                  {renderAmountCell ? renderAmountCell(invoice, index) : (
                    formContextType !== 'none' ? (
                      <InvoiceAmount
                        invoice={invoice}
                        index={index}
                        isLoading={isLoading}
                        formContextType={formContextType}
                      />
                    ) : (
                      <Box sx={{ fontSize: 14 }}>
                        {invoice?.amountToApply || 0}
                      </Box>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showSummary && formContextType !== 'none' && (
        <Stack direction="row" sx={{ mt: 2, float: 'right', gap: 2 }}>
          <Box>
            <Typography fontSize={15}>
              Amount To Apply:
            </Typography>
            <Typography fontSize={15}>
              Amount To Credit:
            </Typography>
          </Box>
          <Box>
            <Typography fontSize={15} fontWeight={600}>
              {formatCurrency(totalSelectedAmount)}
            </Typography>
            <Typography fontSize={15} fontWeight={600}>
              {formatCurrency(amountToCredit)}
            </Typography>
          </Box>
        </Stack>
      )}
    </>
  )
}

export default SharedOutStandingTransactions;
