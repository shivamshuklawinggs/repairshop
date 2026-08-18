import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, FormHelperText, Tooltip, Dialog, DialogActions, IconButton } from '@mui/material';
import { PaymentMethodsOptions } from '@/types/enum';
import SearchInvoice from './SearchInvoice';
import { useCreditLeft } from './hooks/useCreditLeft';
import useDepositToOptions from '@/hooks/DepositToOptions';
import ChartAccountForm from '@/pages/chart-accounts-service/ChartAccountForm';
import { useQueryClient } from '@tanstack/react-query';
import { UpdateRecievedPamentSchemaType } from '@/components/common/PaymentReceived/payment.validate';
import CustomDatePicker from '@/components/common/CommonDatePicker';
import { getIcon } from '@/components/common/icons/getIcon';
import { NumericInput } from '@/components/ui';
import AppDialog from '@/components/ui/AppDialog';

interface EditRecievedPaymentFormFieldsProps {
    isLoading: boolean;
    customerLabel?: string;
    depositToLabel?: string;
    amountLabel?: string;
    searchLabel?: string;
    customerName?: string;
}

const EditRecievedPaymentFormFields: React.FC<EditRecievedPaymentFormFieldsProps> = ({
    isLoading,
    customerLabel = 'Customer',
    depositToLabel = 'Received In',
    amountLabel = 'Amount Received',
    searchLabel,
    customerName = '',
}) => {
    const QueryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { DepositToOptions } = useDepositToOptions(["Bank", "Credit Card"]);
    const { control, formState: { errors }, setValue, watch } = useFormContext<UpdateRecievedPamentSchemaType>();
    const creditLeft = useCreditLeft();
    const handleAmountChange = (value: string) => {
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            const amount = parseFloat(value) || 0;
            setValue("amount", amount, { shouldValidate: true });
        }
    };

    const handleDatePickerChange = (field: 'paymentDate' | 'postingDate') => (e: any) => {
        const value = e.target.value || null;
        setValue(field, value, { shouldValidate: true });
    };

    useEffect(() => {
        if (!watch('postingDate')) {
            setValue("postingDate", watch('paymentDate'));
        }
    }, [watch('paymentDate')]);

    return (
        <>
            <Grid item xs={12} md={6}>
                <TextField
                    size='small'
                    label={customerLabel}
                    value={customerName}
                    disabled
                    fullWidth
                    helperText={errors.customer?.message}
                    error={!!errors.customer}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Tooltip title={`Enter number to filter`} placement="top">
                    <SearchInvoice isLoading={isLoading} label={searchLabel} />
                </Tooltip>
            </Grid>
            <Grid item xs={12} md={6}>
                <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                        <CustomDatePicker
                            size='small'
                            label="Payment Date"
                            name='paymentDate'
                            value={field.value}
                            onChange={handleDatePickerChange("paymentDate")}
                            fullWidth={true}
                            error={!!errors.paymentDate}
                            helperText={errors.paymentDate?.message}
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
                            onChange={handleDatePickerChange("postingDate")}
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
                <NumericInput size='small'
                    label={amountLabel}
                    value={watch("amount")}
                    onChange={(value) => handleAmountChange(String(value))}
                    fullWidth
                    disabled={isLoading}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField size='small'
                    label="Unsettled Amount"
                    value={creditLeft}
                    type="text"
                    fullWidth
                    disabled
                    inputProps={{ inputMode: 'decimal' }}
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

export default EditRecievedPaymentFormFields;
