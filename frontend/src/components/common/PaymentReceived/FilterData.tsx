import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Box, Checkbox, FormControlLabel, Chip, Paper, Grid } from '@mui/material';
import { formatDate } from '@/utils/dateUtils';
import CustomDatePicker from '@/components/common/CommonDatePicker';
import SearchInvoice from './SearchInvoice';

interface FilterDataProps {
  isLoading: boolean;
  searchLabel?: string;
}

const FilterData: React.FC<FilterDataProps> = ({ isLoading, searchLabel }) => {
  const { control, watch, setValue } = useFormContext<any>();
  const watchedFields = watch();

  const handleDatePickerChange = (field: 'fromDate' | 'toDate') => (e: any) => {
    const value = e.target.value || null;
    setValue(field, value, { shouldValidate: true });
  };

  const handleOverdueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('overdueOnly', event.target.checked ? "true" : "", { shouldValidate: true });
  };

  const getActiveFilters = () => {
    const filters = [];
    if (watchedFields.fromDate) {
      filters.push({ label: `From: ${formatDate(watchedFields.fromDate)}`, onDelete: () => setValue('fromDate', null) });
    }
    if (watchedFields.toDate) {
      filters.push({ label: `To: ${formatDate(watchedFields.toDate)}`, onDelete: () => setValue('toDate', null) });
    }
    if (watchedFields.overdueOnly) {
      filters.push({ label: 'Overdue Only', onDelete: () => setValue('overdueOnly', '') });
    }
    if (watchedFields.searchInvoice) {
      filters.push({ label: `Search: ${watchedFields.searchInvoice}`, onDelete: () => setValue('searchInvoice', '') });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  return (
    <Box sx={{ mb: 2 }}>
      {activeFilters.length > 0 && (
        <Paper variant="outlined" sx={{ pt: 0.5, mb: 2, borderRadius: 0.5, border: 'none' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter.label}
                onDelete={filter.onDelete}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '13px', borderColor: '#cdcdcd' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <SearchInvoice isLoading={isLoading} size='small' label={searchLabel} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Controller
            name="fromDate"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="From Date"
                value={field.value}
                size='small'
                fullWidth={true}
                name='fromDate'
                onChange={handleDatePickerChange('fromDate')}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Controller
            name="toDate"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="To Date"
                value={field.value}
                size='small'
                fullWidth={true}
                name='toDate'
                minDate={watchedFields.fromDate || undefined}
                onChange={handleDatePickerChange('toDate')}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px", fontWeight: 500 } }}
            control={
              <Controller
                name="overdueOnly"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    size='small'
                    checked={field.value === "true"}
                    onChange={handleOverdueChange}
                    disabled={isLoading}
                    color="primary"
                    sx={{
                      pr: 0.6,
                    }}
                  />
                )}
              />
            }
            label="Overdue Only"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilterData;
