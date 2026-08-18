import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, Divider, alpha, Checkbox, Chip, DialogActions, IconButton, MenuItem, FormControl, InputLabel, Select, Card, CardContent } from '@mui/material';
import { Email as EmailIcon, Send as SendIcon, Refresh as RefreshIcon, Description as DescriptionIcon, Close as CloseIcon, InsertDriveFile as InsertDriveFileIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '@/service/apiService';
import { useQuery } from '@tanstack/react-query';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useForm, Controller } from 'react-hook-form';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';



interface Data {
  summary: {
    subTotal: number
    taxTotal: number
    discount: number
    finalAmount: number
    totalRecieved: number
    balanceDue: number
  };
  _id: string
  address: string
  paymentStatus:| "overpaid"| "paid_late" | "paid" | "partial_late" | "overdue" | "partial" | "upcoming" | "due";
  emailStatus: string
  companyId: string
  customerId: string
  email: string
  invoiceNumber: string
  status: string
  type: string
  invoiceDate: string
  postingDate: string
  dueDate: string
  customerNotes: string
  terms_conditions: string
  discountPercent: number
  deposit: number
  paymentOptions: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  id: string
}
 interface ResponseApiData {
  success: boolean
  data: Data
  summary: {
    _id: string
    company: string
    phone: string
    email?:string;
    createdAt: string
    totalInvoices: number
    paidInvoices: number
    latePayments: number
    upcomingInvoices: number
    totalAmount: number
    totalTax: number
    totalRecieved: number
    totalbalanceDue: number
    totalReminders:number
  }
}





interface InvoiceEmailRemindersProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

const InvoiceEmailReminders: React.FC<InvoiceEmailRemindersProps> = ({ open, onClose, invoiceId }) => {
  const [loading, setLoading] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState('');

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      message: '',
      sendMeCopy: false,
    },
  });
  const { data: response, isPending, refetch } = useQuery<ResponseApiData>({
    queryKey: ['invoice-details', invoiceId],
    queryFn: () => apiService.getAccountInvoiceById(invoiceId),
    enabled: open && !!invoiceId,
  });

  const invoiceData = response?.data;
  const customerSummary = response?.summary;

  const availableVariables = [
    { label: 'Customer Name', value: '{{customerName}}', source: 'customerSummary', field: 'company' },
    { label: 'Customer Email', value: '{{customerEmail}}', source: 'customerSummary', field: 'email' },
    { label: 'Customer Phone', value: '{{customerPhone}}', source: 'customerSummary', field: 'phone' },
    { label: 'Invoice Number', value: '{{invoiceNumber}}', source: 'invoiceData', field: 'invoiceNumber' },
    { label: 'Invoice Amount', value: '{{invoiceAmount}}', source: 'invoiceData', field: 'summary.finalAmount' },
    { label: 'Balance Due', value: '{{balanceDue}}', source: 'invoiceData', field: 'summary.balanceDue' },
    { label: 'Due Date', value: '{{dueDate}}', source: 'invoiceData', field: 'dueDate' },
    { label: 'Payment Status', value: '{{paymentStatus}}', source: 'invoiceData', field: 'paymentStatus' },
    { label: 'Total Invoices', value: '{{totalInvoices}}', source: 'customerSummary', field: 'totalInvoices' },
    { label: 'Paid Invoices', value: '{{paidInvoices}}', source: 'customerSummary', field: 'paidInvoices' },
    { label: 'Late Payments', value: '{{latePayments}}', source: 'customerSummary', field: 'latePayments' },
    { label: 'Total Reminders', value: '{{totalReminders}}', source: 'customerSummary', field: 'totalReminders' },
  ];

  const getpaymentStatusLabel = (status: string) => {
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
    return labels[status] || status;
  };

  const getpaymentStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      overpaid: 'info',
      paid_late: 'warning',
      paid: 'success',
      partial_late: 'error',
      overdue: 'error',
      partial: 'warning',
      upcoming: 'info',
      due: 'warning',
    };
    return colors[status] || 'default';
  };

  const insertVariable = (variable: string) => {
    const currentMessage = control._formValues.message || '';
    const variableSpan = `<span class="variable-placeholder" contenteditable="false" style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-weight: 500; color: #1565c0;">${variable}</span>&nbsp;`;
    setValue('message', currentMessage + variableSpan);
  };



  useEffect(() => {
    if (invoiceData) {
      const statusLabel = getpaymentStatusLabel(invoiceData.paymentStatus);
      const isOverdue = ['overdue', 'partial_late', 'paid_late'].includes(invoiceData.paymentStatus);
      setValue('to', invoiceData.email || customerSummary?.email || '');
      setValue('subject', `REMINDER: Payment due to ${customerSummary?.company || 'Your Company'}`);
      const defaultMessage = `<p>Dear ${customerSummary?.company || 'Customer'},</p>
<p>This is a reminder that your invoice #${invoiceData.invoiceNumber} for ${invoiceData.summary?.finalAmount || 0} is currently ${statusLabel}.</p>
<p>Amount Due: ${invoiceData.summary?.balanceDue || 0}</p>
<p>Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
<p>${isOverdue ? 'This payment is overdue. Please arrange for payment at your earliest convenience.' : 'Please arrange for payment before the due date.'}</p>
<p>Thank you for your business.</p>`;
      setValue('message', defaultMessage);
    }
  }, [invoiceData, customerSummary, setValue]);

  const onSendManualReminder = async (formData: any) => {
    console.log('Form data submitted:', formData);
    if (!invoiceData) return;
    setLoading(true);
    try {
      const isOverdue = ['overdue', 'partial_late', 'paid_late'].includes(invoiceData.paymentStatus);
      const payload = {
        invoiceNumber: invoiceData.invoiceNumber,
        type: isOverdue ? 'overdue' : 'before_due',
        message: formData.message,
        subject: formData.subject,
        cc: formData.cc,
        bcc: formData.bcc,
        sendMeCopy: formData.sendMeCopy,
        to: formData.to,
      };
      console.log('API payload:', payload);
      const response = await apiService.sendInvoiceReminderManually(payload);
      toast.success(response?.message || 'Email reminder sent successfully');
      onClose();
      reset();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };
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
          px: 3,
          pt: 1.5,
          pb: 1.5,
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
            <EmailIcon sx={{ fontSize: 14, color: 'white' }} />
          </Box> */}
           <Box>
            <Typography fontSize={16} fontWeight={600} color='#101721' mb={0.4}>
              Invoice Payment Reminder
            </Typography>
            <Typography fontSize={13} color="#64748b" lineHeight={1}>
              Send payment reminder to customer
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#101721' }}>
          {getIcon('CloseIcon')}
        </IconButton>
      </DialogTitle>

      <DialogContent style={{ paddingTop: '20px', paddingBottom: '10px', paddingLeft:'20px', paddingRight:'20px' }}>
        {invoiceData ? (
          <Box component="form" onSubmit={handleSubmit(onSendManualReminder)}>
            <Grid container spacing={2}>
            {/* Invoice Details Section */}
            <Grid item xs={12}>
              {/* <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Invoice Details
              </Typography> */}
              <Box
                sx={{
                  py: 0.8,
                  px: 2,
                  border: '1px solid #ddd',
                  borderRadius: 0.5,
                }}
              >
                <Grid container spacing={0.5}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {customerSummary?.company  || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography fontSize={15} fontWeight={500}>
                      {invoiceData.summary?.finalAmount || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      #{invoiceData.invoiceNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
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
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Customer Information */}
            {/* <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Customer Information
              </Typography>
              <Box
               sx={{
                  py: 0.8,
                  px: 2,
                  border: '1px solid #ddd',
                  borderRadius: 0.5,
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Customer Since
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {customerSummary?.createdAt ? new Date(customerSummary.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Paid Invoices
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {customerSummary?.paidInvoices || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Late Payments
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {customerSummary?.latePayments || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Coming Due
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {customerSummary?.upcomingInvoices || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid> */}

            {/* Invoice Summary */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Invoice Summary
              </Typography>
              <Box
                sx={{
                  py: 0.8,
                  px: 2,
                  border: '1px solid #ddd',
                  borderRadius: 0.5,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {invoiceData.summary?.finalAmount || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining Balance
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {invoiceData.summary?.balanceDue || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      First Sent
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      Not yet sent
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Reminders Sent
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {customerSummary?.totalReminders || 0} times
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Email Composition */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
                Email Composition
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="to"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="To"
                        placeholder="Recipient email"
                        size='small'
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="cc"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cc"
                        placeholder="Add Cc recipients"
                        size='small'
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="bcc"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Bcc"
                        placeholder="Add Bcc recipients"
                        size='small'
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Controller
                      name="sendMeCopy"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          {...field}
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          size="small"
                        />
                      )}
                    />
                    <Typography variant="body2">Send me a copy</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="subject"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Subject"
                        placeholder="Email subject"
                        size='small'
                      />
                    )}
                  />
                </Grid>
                {/* <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
                      Insert Variables
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Select Variable</InputLabel>
                          <Select
                            value={selectedVariable}
                            label="Select Variable"
                            onChange={(e) => setSelectedVariable(e.target.value)}
                            size='small'
                          >
                            {availableVariables.map((variable) => (
                              <MenuItem key={variable.value} value={variable.value}>
                                {variable.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="outlined"
                          startIcon={<InsertDriveFileIcon />}
                          onClick={() => {
                            if (selectedVariable) {
                              insertVariable(selectedVariable);
                              setSelectedVariable('');
                            }
                          }}
                          disabled={!selectedVariable}
                          sx={{ borderRadius: 0.5 }}
                        >
                          Insert Variable
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
                    Message
                  </Typography>
                  <Box>
                    <Controller
                      name="message"
                      control={control}
                      render={({ field }) => (
                        <CKEditor
                          editor={ClassicEditor as any}
                          data={field.value}
                          onChange={(event: any, editor: any) => {
                            const data = editor.getData();
                            field.onChange(data);
                          }}
                          config={{
                            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
                          }}
                        />
                      )}
                    />
                  </Box>
                </Grid> */}
              </Grid>
            </Grid>
          </Grid>
          <DialogActions sx={{ py: 2, mt:1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              {/* <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  refetch();
                }}
              >
                Rewrite
              </Button> */}
              {/* <Button
                variant="outlined"
                size="large"
                startIcon={<DescriptionIcon />}
                onClick={() => {
                  if (invoiceData) {
                    const statusLabel = getpaymentStatusLabel(invoiceData.paymentStatus);
                    const isOverdue = ['overdue', 'partial_late', 'paid_late'].includes(invoiceData.paymentStatus);
                    setValue('subject', `REMINDER: Payment due to ${customerSummary?.company || 'Your Company'}`);
                    const defaultMessage = `<p>Dear ${customerSummary?.company || 'Customer'},</p>
<p>This is a reminder that your invoice #${invoiceData.invoiceNumber} for ${invoiceData.summary?.finalAmount  || 0} is currently ${statusLabel}.</p>
<p>Amount Due: ${invoiceData.summary?.finalAmount || invoiceData.summary?.subTotal || 0}</p>
<p>Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
<p>${isOverdue ? 'This payment is overdue. Please arrange for payment at your earliest convenience.' : 'Please arrange for payment before the due date.'}</p>
<p>Thank you for your business.</p>`;
                    setValue('message', defaultMessage);
                  }
                }}
              >
                Switch to Default Message
              </Button> */}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              >
                {loading ? 'Sending...' : 'Send Reminder'}
              </Button>
            </Box>
          </DialogActions>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </AppDialog>
  );
};

export default InvoiceEmailReminders;
