import { Grid, TextField } from '@mui/material'
import React from 'react'
import { ICarrier, ICustomer } from '@/types';
import { Controller, useFormContext } from 'react-hook-form';
const McNUmberFiled: React.FC<{ columnSize: number }> = ({ columnSize }) => {
    const form = useFormContext<ICarrier | ICustomer>();
    return (
        <Grid item xs={12} md={columnSize}>
            <Controller
                name="mcNumber"
                control={form.control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        fullWidth
                        label="MC Number"
                        size="small"
                        error={!!form.formState.errors.mcNumber}
                        helperText={form.formState.errors.mcNumber?.message}
                        InputLabelProps={{
                            shrink: Boolean(field.value?.toString().trim()),
                        }}
                    />
                )}
            />
        </Grid>
    )
}

export default McNUmberFiled