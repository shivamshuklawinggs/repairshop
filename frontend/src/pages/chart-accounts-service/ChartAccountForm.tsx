import React, { useEffect, useMemo } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Grid, TextField, Typography, Divider, } from '@mui/material';
import FormSelect from '@/components/ui/FormSelect';
import { SelectOption } from '@/components/ui/FormSelect';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import apiService from '@/service/apiService';
import { IChartAccount, IParentAccountTypeEnum } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChartAccountTypes } from '@/hooks/useChartAccountTypes';

const baseDefaults: IChartAccount = {
  name: '',
  accountType: '',
  detailType: '',
  isActive: true,
  isSubAccount: false,
  parentAccountId: undefined,
  description: '',
};

interface Props {
  initial?: Partial<IChartAccount>;
  onSuccess?: () => void;
  filterType?: IParentAccountTypeEnum;

}

type SelectGroup = {
  label: string;
  options: SelectOption[];
};

const formatTypeLabel = (type?: string) => {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const groupByType = <
  T extends {
    _id?: string;
    type?: string;
    name?: string;
    detailType?: string;
  }
>(
  items: T[]
): SelectGroup[] => {
  const grouped = new Map<string, SelectOption[]>();

  items.forEach((item) => {
    if (!item._id) return;
    const groupLabel = formatTypeLabel(item.type);
    const optionLabel = item.name || item.detailType || '-';
    const option: SelectOption = { value: item._id, label: optionLabel };

    if (!grouped.has(groupLabel)) {
      grouped.set(groupLabel, [option]);
      return;
    }

    grouped.get(groupLabel)?.push(option);
  });

  return Array.from(grouped.entries()).map(([label, options]) => ({ label, options }));
};

const findOptionInGroups = (groups: SelectGroup[], value?: string | null): SelectOption | null => {
  if (!value) return null;
  for (const group of groups) {
    const option = group.options.find((opt) => opt.value === value);
    if (option) return option;
  }
  return null;
};

const ChartAccountForm: React.FC<Props> = ({ initial, onSuccess, filterType }) => {
  const queryClient = useQueryClient();
  const mergedDefaults = { ...baseDefaults, ...initial } as IChartAccount;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: {  isSubmitting },
    getValues,
  } = useForm<IChartAccount>({
    mode: 'all',
    defaultValues: mergedDefaults,
  });

  const watchedAccountType = watch('accountType');

  const { accountTypes, detailTypes, isLoadingDetailTypes } = useChartAccountTypes(watchedAccountType);

  const { data: accounts = [] } = useQuery<IChartAccount[]>({
    queryKey: ['chartAccounts'],
    queryFn: async () => {
      const response = await apiService.getChartAccounts();
      const excludeId = (initial && initial._id) || undefined;
      return response.data.filter((item: IChartAccount) => item._id !== excludeId);
    },
  });

  // Transform data for react-select
  const accountTypeOptions = useMemo(
    () => groupByType(filterType ? accountTypes.filter((t) => t.type === filterType) : accountTypes),
    [accountTypes, filterType]
  );


  const detailTypeOptions = useMemo(
    () => groupByType(detailTypes),
    [detailTypes]
  );

  const parentAccountOptions = useMemo(
    () => accounts.filter((a) => a._id).map((a) => ({ value: a._id!, label: a.name })),
    [accounts]
  );

  const mutation = useMutation({
    mutationFn: (data: IChartAccount) => {
      const id = (data as any)._id || (initial && initial._id);
      if (id) {
        return apiService.updateChartAccount(id, data);
      } else {
        return apiService.createChartAccount(data);
      }
    },
    onSuccess: () => {
      toast('Account saved successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['chartAccounts'] });
      onSuccess && onSuccess();
    },
    onError: (err: any) => {
      console.error('save error', err);
      toast(err?.message || 'Failed to save', { type: 'error' });
    }
  });

  const watchedIsSubAccount = watch('isSubAccount');
  const watchedValues = watch();

  const isEdit = Boolean(mergedDefaults._id || getValues('_id'));
  const readOnly = isEdit && getValues("readonly");

  useEffect(() => {
    reset({ ...baseDefaults, ...initial });
  }, [initial, reset]);

  // When accountType changes, reset detailType
  useEffect(() => {
    if (isEdit) return; // Don't reset on initial load of an edit form
    setValue('detailType', '');
  }, [watchedAccountType, setValue, isEdit]);

  // When a filterType is provided and narrows to a single account type, auto-select it
  useEffect(() => {
    if (isEdit || !filterType) return;
    const filtered = accountTypes.filter((t) => t.type === filterType);
    if (filtered.length === 1 && filtered[0]._id && !watchedAccountType) {
      setValue('accountType', filtered[0]._id);
    }
  }, [filterType, accountTypes, watchedAccountType, setValue, isEdit]);

  const onSubmit = (data: IChartAccount) => {
    mutation.mutate(data);
  };

  const canSubmit = useMemo(
    () => Boolean(watchedValues.name && watchedValues.accountType && watchedValues.detailType),
    [watchedValues.name, watchedValues.accountType, watchedValues.detailType]
  );

  return (
    <Box px={{xs:2, md:2.5}} py={2.5}>
      <Typography fontSize={14} fontWeight={600}  mb={2}>
        {isEdit ? 'Edit Account' : 'New Account'}
      </Typography>

      <form onSubmit={(e) => {
      e.stopPropagation();
      handleSubmit(onSubmit)(e);
    }} >
        <Grid container spacing={1}>
          <Grid item xs={12} md={12}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Account name is required' }}
              render={({ field, fieldState }) => (
                <TextField size='small'
                  {...field}
                  fullWidth
                  label="Account name"
                  error={!!fieldState.error}
                  inputProps={{
                    readOnly: readOnly
                  }}
                   disabled={readOnly}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="accountType"
              control={control}
              rules={{ required: 'Account type is required' }}
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Account type"
                  options={accountTypeOptions}
                  value={findOptionInGroups(accountTypeOptions, field.value)}
                  onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                  placeholder="Select account type"
                  isClearable
                  readOnly={readOnly}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="detailType"
              control={control}
              rules={{ required: 'Detail type is required' }}
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Detail type"
                  options={detailTypeOptions}
                  value={findOptionInGroups(detailTypeOptions, field.value)}
                  onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                  placeholder="Select detail type"
                  isClearable
                  isDisabled={!watchedAccountType || isLoadingDetailTypes || readOnly}
                  isLoading={isLoadingDetailTypes}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={12} style={{paddingTop:'5px'}}>
            <Controller
              name="isSubAccount"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                   disabled={readOnly}
                  control={
                  <Checkbox {...field} size='small'
                  sx={{
                    pr:0.6,
                    '& .MuiSvgIcon-root': {
                      fontSize: 18,
                    }
                  }}
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)} />
                }
                  label="Make this a subaccount"
                  sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14.6px'
                  }
                }}
                />
              )}
            />
          </Grid>

          {watchedIsSubAccount && (
            <Grid item xs={12} md={12} mb={1}>
              <Controller
                name="parentAccountId"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Parent account"
                    options={parentAccountOptions}
                    value={parentAccountOptions.find((opt) => opt.value === field.value) || null}
                    onChange={(option) => field.onChange((option as SelectOption)?.value || undefined)}
                    placeholder="Select parent account"
                    isClearable
                    readOnly={readOnly}
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={12} md={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextField size='small' {...field} fullWidth label="Description"  inputProps={{
                    readOnly: readOnly
                  }} disabled={readOnly} />}

            />
          </Grid>

          <Grid item xs={12} md={12}>
            <Typography fontSize={{xs:13, md:14}} fontWeight={600} gutterBottom mt={1}>
              Preview
            </Typography>
            <Box border="1px solid #e0e0e0" borderRadius={0.5} sx={{py:1, px:2}}>
              <Typography fontSize={{xs:13, md:14}}>
                <b>Name:</b> {watchedValues.name || '-'}
              </Typography>
              <Typography fontSize={{xs:13, md:14}}>
                <b>Account type:</b>{' '}
                {accountTypes.find(t => t._id === watchedValues.accountType)?.name || '-'}
              </Typography>
              <Typography fontSize={{xs:13, md:14}}>
                <b>Detail type:</b>{' '}
                {detailTypes.find(t => t._id === watchedValues.detailType)?.name || '-'}
              </Typography>
              <Typography fontSize={{xs:13, md:14}}>
                <b>Subaccount:</b> {watchedValues.isSubAccount ? 'Yes' : 'No'}
              </Typography>
              {watchedValues.isSubAccount && (
                <Typography fontSize={{xs:13, md:14}}>
                  <b>Parent account:</b>{' '}
                  {accounts.find((a) => a._id === watchedValues.parentAccountId)?.name || '-'}
                </Typography>
              )}
              <Typography fontSize={{xs:13, md:14}}>
                <b>Description:</b> {watchedValues.description || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={12}>
            <Box display="flex" gap={1.5} justifyContent="flex-end" mt={1}>
              <Button variant="outlined" onClick={() => onSuccess && onSuccess()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || mutation.isPending || isSubmitting || readOnly}
                variant="contained"
              >
                {isEdit ? 'Save' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ChartAccountForm;
