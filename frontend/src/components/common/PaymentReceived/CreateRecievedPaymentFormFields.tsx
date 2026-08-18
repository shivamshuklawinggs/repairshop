import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
    Box,
    TextField,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Tooltip,
    IconButton,
    Dialog,
    DialogActions,
} from '@mui/material';
import { PaymentMethodsOptions } from '@/types/enum';
import { IPaymentRecived, ICustomerInvoicesPaymentDetails } from '@/types';
import { Close } from '@mui/icons-material';
import SearchInvoice from './SearchInvoice';
import useDepositToOptions from '@/hooks/DepositToOptions';
import { useQueryClient } from '@tanstack/react-query';
import ChartAccountForm from '@/pages/chart-accounts-service/ChartAccountForm';
import CustomDatePicker from '@/components/common/CommonDatePicker';
import { getIcon } from '@/components/common/icons/getIcon';
import { NumericInput } from '@/components/ui';
import AppDialog from '@/components/ui/AppDialog';

interface CreateRecievedPaymentFormFieldsProps {
    customerData: any[];
    isLoading: boolean;
    handleCustomerChange: (customerId: string) => void;
    customerInvoices: ICustomerInvoicesPaymentDetails[];
    customerLabel?: string;
    depositToLabel?: string;
    amountLabel?: string;
    searchLabel?: string;
    getDisplayName: (customer: any) => string;
    tooltipText?: string;
}

const CreateRecievedPaymentFormFields: React.FC<CreateRecievedPaymentFormFieldsProps> = ({
    customerData,
    isLoading,
    handleCustomerChange,
    customerInvoices,
    customerLabel = 'Customer',
    depositToLabel = 'Received In',
    amountLabel = 'Amount Received',
    searchLabel,
    getDisplayName,
    tooltipText = 'Enter number to filter',
}) => {
    const QueryClient = useQueryClient();
    const { DepositToOptions } = useDepositToOptions(["Bank", "Credit Card"]);
    const [open, setOpen] = useState(false);
    const { control, formState: { errors }, setValue, watch } = useFormContext<IPaymentRecived>();

    const watchCustomer = watch("customer");

    const handleAmountChange = (value: string) => {
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            const amount = parseFloat(value) || 0;
            setValue('amount', amount, { shouldValidate: true });

            if (amount === 0) {
                setValue('invoicePayments', []);
                return;
            }

            const existingPayments = watch('invoicePayments') || [];
            const currentTotal = existingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            const difference = parseFloat((amount - currentTotal).toFixed(2));

            // If no change, keep existing
            if (difference === 0) return;

            let newPayments = [...existingPayments];
            let remainingDiff = difference;

            if (difference > 0) {
                // Amount increased: distribute extra to unallocated invoices
                const allocatedIds = new Set(existingPayments.map((p: any) => p.invoiceId));
                for (const invoice of customerInvoices) {
                    if (remainingDiff <= 0 || allocatedIds.has(invoice._id)) continue;
                    const addAmount = parseFloat(Math.min(invoice.balanceDue, remainingDiff).toFixed(2));
                    if (addAmount > 0) {
                        newPayments.push({
                            invoiceId: invoice._id,
                            amount: addAmount,
                            totalAmountWithTax: invoice.totalAmountWithTax,
                        });
                        remainingDiff = parseFloat((remainingDiff - addAmount).toFixed(2));
                    }
                }
            } else {
                // Amount decreased: reduce from existing payments (from last to first)
                for (let i = newPayments.length - 1; i >= 0 && remainingDiff < 0; i--) {
                    const payment = newPayments[i];
                    const invoice = customerInvoices.find(inv => inv._id === payment.invoiceId);
                    if (!invoice) continue;
                    const reduceAmount = parseFloat(Math.min(payment.amount, Math.abs(remainingDiff)).toFixed(2));
                    if (reduceAmount > 0) {
                        payment.amount = parseFloat((payment.amount - reduceAmount).toFixed(2));
                        remainingDiff = parseFloat((remainingDiff + reduceAmount).toFixed(2));
                        if (payment.amount === 0) {
                            newPayments.splice(i, 1);
                        }
                    }
                }
            }

            setValue('invoicePayments', newPayments, { shouldValidate: true });
        }
    };

    useEffect(() => {
        if (watchCustomer) {
            const selectedCustomer = customerData?.find((item: any) => item?._id === watchCustomer);
            if (selectedCustomer) {
                setValue("paymentMethod", selectedCustomer?.paymentMethod || "");
            }
        }
    }, [watchCustomer, customerData, setValue]);

    useEffect(() => {
        if (!watch('postingDate')) {
            setValue("postingDate", watch('paymentDate'));
        }
    }, [watch('paymentDate')]);

    const handleDatePickerChange = (field: 'paymentDate' | 'postingDate') => (e: any) => {
        const value = e.target.value || null;
        setValue(field, value, { shouldValidate: true });
    };

    return (
        <>
            <Grid item xs={12} md={6}>
                <FormControl size='small' fullWidth error={!!errors.customer}>
                    <InputLabel id="customer-label">{customerLabel}</InputLabel>
                    <Controller
                        name="customer"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                disabled={isLoading}
                                labelId="customer-label"
                                label={customerLabel}
                                error={!!errors.customer}
                                value={field.value || ""}
                                onChange={(e) => {
                                    field.onChange(e.target.value);
                                    handleCustomerChange(e.target.value as string);
                                }}
                                renderValue={(selected) => {
                                    const selectedCustomer = customerData?.find((item: any) => item?._id === selected);
                                    return (
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            {selectedCustomer ? getDisplayName(selectedCustomer) : ""}
                                            {selected && (
                                                <IconButton
                                                    size="small"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCustomerChange('');
                                                    }}
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    );
                                }}
                            >
                                <MenuItem disabled value="">Select {customerLabel}</MenuItem>
                                {customerData?.map((item: any) => (
                                    <MenuItem key={item._id as string} value={item._id as string}>
                                        {getDisplayName(item)}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                    <FormHelperText error={!!errors.customer}>{errors.customer?.message}</FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
                <Tooltip title={tooltipText} placement="top">
                    <Controller
                        name="searchInvoice"
                        control={control}
                        render={({ field }) => (
                            <SearchInvoice isLoading={isLoading} label={searchLabel} />
                        )}
                    />
                </Tooltip>
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                        <CustomDatePicker
                            size='small'
                            fullWidth
                            helperText={errors.paymentDate?.message}
                            label="Payment Date"
                            name='paymentDate'
                            error={!!errors.paymentDate}
                            value={field.value}
                            onChange={handleDatePickerChange('paymentDate')}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="postingDate"
                    control={control}
                    render={({ field }) => (
                        <CustomDatePicker
                            size='small'
                            label="Posting Date"
                            name='postingDate'
                            value={field.value}
                            onChange={handleDatePickerChange('postingDate')}
                            fullWidth={true}
                            error={!!errors.postingDate}
                            helperText={errors.postingDate?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                        <FormControl size='small' fullWidth error={!!errors.paymentMethod}>
                            <InputLabel>Payment Method</InputLabel>
                            <Select {...field} label="Payment Method">
                                {PaymentMethodsOptions.map((option) => (
                                    <MenuItem key={option.value} disabled={option.disabled} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="referenceNo"
                    control={control}
                    render={({ field }) => (
                        <TextField size='small'
                            {...field}
                            disabled={isLoading}
                            label="Reference Number"
                            fullWidth
                            error={!!errors.referenceNo}
                            helperText={errors.referenceNo?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl size='small' fullWidth error={!!errors.depositTo}>
                    <InputLabel id="depositTo">{depositToLabel}</InputLabel>
                    <Controller
                        name="depositTo"
                        control={control}
                        render={({ field }) => (
                            <Select
                                id="depositTo"
                                {...field}
                                disabled={isLoading}
                                label={depositToLabel}
                                fullWidth
                                error={!!errors.depositTo}
                            >
                                <MenuItem value="" onClick={() => setOpen(true)}>+ Create New Chart Account</MenuItem>
                                {DepositToOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                    <FormHelperText  error={!!errors.depositTo}>{errors.depositTo?.message}</FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                        <NumericInput size='small'
                            label={amountLabel}
                            value={watch("amount")}
                            onChange={(value) => handleAmountChange(String(value))}
                            fullWidth
                            disabled={isLoading}
                            error={!!errors.amount}
                            helperText={errors.amount?.message}
                        />
                    )}
                />
            </Grid>
            <AppDialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogActions className='dialog-close'>
                    <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#333' }}>
                        {getIcon('CloseIcon')}
                    </IconButton>
                </DialogActions>
                <ChartAccountForm
                    initial={undefined}
                    onSuccess={() => {
                        setOpen(false);
                        QueryClient.invalidateQueries({ queryKey: ['depositToOptions'] });
                    }}
                />
            </AppDialog>
        </>
    );
};

export default CreateRecievedPaymentFormFields;
