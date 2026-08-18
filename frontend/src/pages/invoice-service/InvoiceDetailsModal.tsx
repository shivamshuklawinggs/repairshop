import React from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Chip, Divider, CircularProgress, alpha, IconButton } from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon, Event as EventIcon, Person as PersonIcon, Business as BusinessIcon, AttachMoney as AttachMoneyIcon, Phone as PhoneIcon, Email as EmailIcon, AttachMoneyTwoTone, AttachMoneyRounded, AttachMoneySharp, AttachMoney } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { formatDate } from '@/utils/dateUtils';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';

interface InvoiceData {
  summary: {
    subTotal: number;
    taxTotal: number;
    discount: number;
    finalAmount: number;
    totalRecieved: number;
    balanceDue: number;
  };
  _id: string;
  address: string;
  paymentStatus: "overpaid" | "paid_late" | "paid" | "partial_late" | "overdue" | "partial" | "upcoming" | "due";
  emailStatus: string;
  companyId: string;
  customerId: string;
  email: string;
  invoiceNumber: string;
  status: string;
  type: string;
  invoiceDate: Date;
  postingDate: Date;
  dueDate: Date;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  paymentOptions: string;
  customer?: {
    company: string;
    displayCustomerName: string;
    email: string;
    phone: string;
  };
  company?: {
    label: string;
    email: string;
    phone: string;
  };
}

interface CustomerSummary {
  _id: string;
  company: string;
  phone: string;
  email?: string;
  createdAt: Date;
  totalInvoices: number;
  paidInvoices: number;
  latePayments: number;
  upcomingInvoices: number;
  totalAmount: number;
  totalTax: number;
  totalRecieved: number;
  totalbalanceDue: number;
  totalReminders: number;
}

interface ResponseApiData {
  success: boolean;
  data: InvoiceData;
  summary: CustomerSummary;
}

interface InvoiceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ open, onClose, invoiceId }) => {
  const { data: response, isPending } = useQuery<ResponseApiData>({
    queryKey: ['invoice-details', invoiceId],
    queryFn: () => apiService.getAccountInvoiceById(invoiceId),
    enabled: open && !!invoiceId,
  });

  const invoiceData = response?.data;
  const customerSummary = response?.summary;
  console.log("paymentStatus", invoiceData?.paymentStatus)
  const getpaymentStatusLabel = (status: string) => {
    console.log("??/", status)
    const labels: Record<string, string> = {
      overpaid: 'Overpaid',
      paid_late: 'Paid Late',
      paid: 'Paid',
      partial_late: 'Partial (Late)',
      overdue: 'Overdue',
      partial: 'Partial',
      upcoming: 'Due Soon',
      due: 'Due Today',
    };
    console.log("sttus???", labels[status] || status)
    return labels[status] || status;
  };

  const getpaymentStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      overpaid: 'info',
      paid_late: 'warning',
      paid: 'success',
      partial_late: 'error',
      overdue: 'error',
      partial: 'warning',
      upcoming: 'info',
      due: 'warning',
    };
    return colors[status] || 'info';
  };

  const InfoCard = ({ icon: Icon, label, value, color = 'primary' }: { icon: any, label: string, value: any, color?: 'primary' | 'success' | 'warning' | 'error' | 'info' }) => (
    <Box
      sx={{
        py: 0.6,
        px: 1.4,
        border: '1px solid #ddd',
        borderRadius: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
      }}
    >
      <Icon sx={{ fontSize: 18, color: `${color}.main` }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {value || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 1 },
      }}
    >

      <DialogTitle
        sx={{
          background: (theme) => alpha(theme.palette.primary.main, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ddd',
          //borderColor: 'divider',
          backgroundColor: '#fff',
          px: 2.5,
          py: 1.3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 2,
              display: {xs:'none', md:'flex'},
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#494d57',
            }}
          >
            <DescriptionIcon sx={{ fontSize: 14, color: 'white' }} />
          </Box> */}

          <Box sx={{display:'flex', gap:1.5}}>
            <Typography fontSize={15} fontWeight={600} color='#101721' mb={0}>
              Invoice Details
            </Typography>
            <Typography fontSize={12} color="#64748b" sx={{fontWeight:'600',border:'1px solid #64748b', borderRadius:0.5, px:1, lineHeight:'1.7'}}>
              {invoiceData ? `#${invoiceData.invoiceNumber}` : 'Loading...'}
            </Typography>
          </Box>

        </Box>
        {/* <Button onClick={onClose} size="small" sx={{ color: '#fff' }} startIcon={<CloseIcon />}>
          Close
        </Button> */}
        <IconButton onClick={onClose} size="small" sx={{ color: '#101721' }}>
          {getIcon('CloseIcon')}
        </IconButton>
      </DialogTitle>

      <DialogContent style={{ padding: '15px 20px'}}>
        {isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : invoiceData ? (
          <Box>
            {/* Invoice Overview */}
            <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
              Invoice Overview
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <InfoCard
                  icon={DescriptionIcon}
                  label="Invoice Number"
                  value={`#${invoiceData.invoiceNumber}`}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoCard
                  icon={EventIcon}
                  label="Invoice Date"
                  value={formatDate(invoiceData.invoiceDate)}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoCard
                  icon={EventIcon}
                  label="Due Date"
                  value={formatDate(invoiceData.dueDate)}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box
                  sx={{
                    py: 0.6,
                    px: 1.4,
                    border: '1px solid #ddd',
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Payment Status
                    </Typography>
                    <Chip
                      variant='outlined'
                      label={getpaymentStatusLabel(invoiceData.paymentStatus)}
                      color={getpaymentStatusColor(invoiceData.paymentStatus)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        py: 0,
                        fontSize: '12px',
                        height: 'auto',
                        px: 0,
                        ml: 0,
                        scale: '0.95',
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Financial Summary */}
            <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
              Financial Summary
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyTwoTone}
                  label="Sub Total"
                  value={invoiceData.summary?.subTotal?.toFixed(2) || '0.00'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyIcon}
                  label="Tax Total"
                  value={invoiceData.summary?.taxTotal?.toFixed(2) || '0.00'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyIcon}
                  label="Discount"
                  value={invoiceData.summary?.discount?.toFixed(2) || '0.00'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyIcon}
                  label="Final Amount"
                  value={invoiceData.summary?.finalAmount?.toFixed(2) || '0.00'}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyIcon}
                  label="Total Received"
                  value={invoiceData.summary?.totalRecieved?.toFixed(2) || '0.00'}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard
                  icon={AttachMoneyIcon}
                  label="Balance Due"
                  value={invoiceData.summary?.balanceDue?.toFixed(2) || '0.00'}
                  color={invoiceData.summary?.balanceDue > 0 ? 'error' : 'success'}
                />
              </Grid>
            </Grid>

            {/* Customer Information */}
            <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
              Customer Information
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <InfoCard
                  icon={BusinessIcon}
                  label="Company"
                  value={invoiceData.customer?.company || customerSummary?.company || 'N/A'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoCard
                  icon={PersonIcon}
                  label="Contact Name"
                  value={invoiceData.customer?.displayCustomerName || 'N/A'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoCard
                  icon={PhoneIcon}
                  label="Phone"
                  value={invoiceData.customer?.phone || customerSummary?.phone || 'N/A'}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoCard
                  icon={EmailIcon}
                  label="Email"
                  value={invoiceData.email || invoiceData.customer?.email || customerSummary?.email || 'N/A'}
                  color="info"
                />
              </Grid>

            </Grid>

            {customerSummary && (
              <>

                {/* Customer Summary */}
                <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                  Customer Account Summary
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={2.4}>
                    <InfoCard
                      icon={DescriptionIcon}
                      label="Total Invoices"
                      value={customerSummary.totalInvoices}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <InfoCard
                      icon={DescriptionIcon}
                      label="Paid Invoices"
                      value={customerSummary.paidInvoices}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <InfoCard
                      icon={DescriptionIcon}
                      label="Late Payments"
                      value={customerSummary.latePayments}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <InfoCard
                      icon={DescriptionIcon}
                      label="Upcoming Invoices"
                      value={customerSummary.upcomingInvoices}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <InfoCard
                      icon={AttachMoneyIcon}
                      label="Total Amount"
                      value={customerSummary.totalAmount?.toFixed(2) || '0.00'}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <InfoCard
                      icon={AttachMoneyIcon}
                      label="Total Received"
                      value={customerSummary.totalRecieved?.toFixed(2) || '0.00'}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <InfoCard
                      icon={AttachMoneyIcon}
                      label="Total Balance Due"
                      value={customerSummary.totalbalanceDue?.toFixed(2) || '0.00'}
                      color={customerSummary.totalbalanceDue > 0 ? 'error' : 'success'}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <InfoCard
                      icon={EmailIcon}
                      label="Total Reminders Sent"
                      value={`${customerSummary.totalReminders} times`}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <InfoCard
                      icon={EventIcon}
                      label="Customer Since"
                      value={formatDate(customerSummary.createdAt)}
                      color="info"
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Additional Details */}
            {(invoiceData.customerNotes || invoiceData.terms_conditions) && (
              <>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                  Additional Details
                </Typography>


                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    {invoiceData.customerNotes && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          Customer Notes:
                        </Typography>
                        <Typography variant="body2" color="text.primary"
                          sx={{
                            py: 1,
                            px: 1.4,
                            border: '1px solid #ddd',
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                          }}>
                          {invoiceData.customerNotes}
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    {invoiceData.terms_conditions && (
                      <Box>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          Terms & Conditions:
                        </Typography>
                        <Typography variant="body2" color="text.primary"
                          sx={{
                            py: 1,
                            px: 1.4,
                            border: '1px solid #ddd',
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                          }}>
                          {invoiceData.terms_conditions}
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                </Grid>


              </>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
            No invoice data available
          </Typography>
        )}
      </DialogContent>
    </AppDialog>
  );
};

export default InvoiceDetailsModal;
