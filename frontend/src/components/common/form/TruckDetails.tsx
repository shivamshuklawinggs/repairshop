import { ICarrier, ICustomer } from '@/types';
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form';
import {
  TextField,
  Grid,
} from '@mui/material';
const TruckDetails = () => {
  const { control, formState: { errors } } =useFormContext<ICarrier | ICustomer>(); 
  return (
    <Grid container spacing={1.75}>
      <Grid item xs={12} md={6}>
        <Controller
          name="truckDetails.vinNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              size='small'
              fullWidth
              label="VIN No"
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              error={!!errors.truckDetails?.vinNumber}
              helperText={errors.truckDetails?.vinNumber?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="truckDetails.licenseNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              size='small'
              fullWidth
              label="License Number"
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={!!errors.truckDetails?.licenseNumber}
              helperText={errors.truckDetails?.licenseNumber?.message}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default TruckDetails