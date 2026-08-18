import React, { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Box, Grid, TextField, Paper, useTheme, alpha } from '@mui/material';
import { IJournalEntry } from './Schema/JournalEntrySchema';
import CustomDatePicker from '@/components/common/CommonDatePicker';
const JournalEntryHeader: React.FC = () => {
  const { control, formState: { errors }, watch, setValue } = useFormContext<IJournalEntry>();
  useEffect(() => {
    if (!watch('postingDate')) {
      setValue("postingDate", watch('journalDate'));
    }
  }, [watch('journalDate')]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 0,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Controller
              name="journalDate"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  size='small'
                  value={field.value}
                  fullWidth={true}
                  label='Journal Date'
                  name='journalDate'
                  onChange={(date) => field.onChange(date)}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="postingDate"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  size='small'
                  value={field.value}
                  fullWidth={true}
                  label='Posting Date'
                  name='postingDate'
                  onChange={(date) => field.onChange(date)}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="journalNumber"
              control={control}
              render={({ field }) => (
                <TextField size='small'
                  {...field}
                  label="Journal No."
                  variant="outlined"
                  disabled={true}
                  error={errors.journalNumber?.message ? true : false}
                  helperText={errors.journalNumber?.message}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default JournalEntryHeader;
