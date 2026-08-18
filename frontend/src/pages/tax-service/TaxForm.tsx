import React, { useEffect, useState } from 'react'
import { Dialog, TextField, Box, Button, CircularProgress, IconButton, useTheme, alpha, Card, CardContent, Typography, Grid } from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from "react-toastify"
import { ITaxOption } from '@/types';
import apiService from '@/service/apiService';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { TaxSchema } from './Schema/TaxSchema';
import { HasPermission } from '@/hooks/authUtils';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import { useChartOfAccount } from '@/hooks/useChartOfAccount';
import FormSelect from '@/components/ui/FormSelect';
import ChartAccountForm from '@/pages/chart-accounts-service/ChartAccountForm';
import { ControlledNumericInput } from '@/components/ui/NumericInput';
import { getIcon } from '@/components/common/icons/getIcon';
import { AccountBalance, Percent, Description } from '@mui/icons-material';
import AppDialog from '@/components/ui/AppDialog';

interface TaxFormProps {
  showModal: boolean;
  handleModalClose: () => void;
  editingItem: ITaxOption | null;
}

const TaxForm: React.FC<TaxFormProps> = ({ showModal, handleModalClose, editingItem }) => {
  const theme = useTheme();
  const qc = useQueryClient()
  const [showChartModal, setShowChartModal] = useState(false)
  const { chartAccountOptions } = useChartOfAccount({ type: ['liability'], removeMasters: ["vendor", "customer"], regularExpression: "TAX", nor: [] })
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, setValue, formState: { errors }, control } = useForm<ITaxOption>({
    resolver: yupResolver(TaxSchema) as any,
  });

  const mutation = useMutation({
    mutationFn: (data: ITaxOption) => {
      if (editingItem?._id) {
        return apiService.updateTaxOption(editingItem._id, data);
      } else {
        return apiService.createTaxOption(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxOptions'] });
      toast.success(editingItem ? 'Tax Option Updated Successfully' : 'Tax Option Created Successfully');
      handleModalClose();
      reset({ label: '', value: 0 });
    },
    onError: (error: any) => {
      console.warn('Error:', error);
      toast.error(error.message);
    }
  });

  const onSubmit: SubmitHandler<ITaxOption> = (data) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (editingItem?._id) {
      setValue('label', editingItem.label);
      setValue('value', editingItem.value);
      setValue('ChartOfAccountId', editingItem.ChartOfAccountId);
      return
    } else {
      reset({ label: '', value: 0, ChartOfAccountId: '' });
      return
    }
  }, [editingItem])
  const OnSuccess = () => {
    setShowChartModal(false)
    qc.invalidateQueries({ queryKey: ['chartAccounts'] });
  }
  return (
    <>
      <HasPermission action="create" resource={["accounting"]} component={
        <AppDialog
          open={showModal}
          onClose={handleModalClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1,
              boxShadow: theme.shadows[4],
              //overflow: 'hidden',
              maxHeight: '90vh'
            }
          }}
        >
          {/* Header with close icon */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 0.5,
            bgcolor: '#fff',
            color: '#101721',
            position: 'relative',
            borderBottom:'1px solid #ddd',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* <Box sx={{
                p: 0.5,
                borderRadius: 2,
                bgcolor: alpha('#fff', 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Percent sx={{ fontSize: 16 }} />
              </Box> */}
              <Typography fontSize={{xs:15, md:16}} sx={{pl:1, fontWeight:'600'}}>
                {editingItem ? 'Edit Tax Option' : 'Add New Tax Option'}
              </Typography>
            </Box>
            <IconButton
              onClick={handleModalClose}
              sx={{
                color: 'inherit',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.1),
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              {getIcon('CloseIcon')}
            </IconButton>
          </Box>

          <Box sx={{ px:{xs:2, md:3}, py:{xs:2, md:2} }}>
            <ErrorHandlerAlert error={mutation.error} />
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={1.75}>
                {/* Tax Information Section */}
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      p:0,
                      borderRadius: 0,
                      border:'none',
                    }}
                  >
                    <CardContent sx={{p:0}} style={{paddingBottom:'0px'}}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {/* <Description sx={{ fontSize: 18, color: 'primary.main' }} /> */}
                        <Typography fontSize={{xs:13, md:14}} sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Tax Information
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField size='small'
                            label="Tax Label"
                            fullWidth
                            placeholder="Enter tax label"
                            {...register('label')}
                            error={!!errors.label}
                            helperText={errors.label?.message}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <ControlledNumericInput
                            name="value"
                            control={control}
                            label="Tax Rate (%)"
                            fullWidth
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={false}
                            placeholder="0.00"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Account Mapping Section */}
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      p:0,
                      borderRadius: 0,
                      border:'none',
                    }}
                  >
                    <CardContent sx={{p:0}} style={{paddingBottom:'0px'}}>
                      {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccountBalance sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Account Mapping
                        </Typography>
                      </Box> */}
                      <Controller
                        name="ChartOfAccountId"
                        control={control}
                        rules={{ required: 'Account type is required' }}
                        render={({ field, fieldState, }) => (
                          <FormSelect
                            label="Chart of Account"
                            options={chartAccountOptions}
                            value={chartAccountOptions.find((opt) => opt.value === field.value) || null}
                            onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                            placeholder="Select Chart of Account"
                            isClearable
                            error={fieldState.error?.message}
                            addNewLabel="+ Add New Chart Account"
                            addNewModal={
                              <AppDialog
                                open={showChartModal}
                                onClose={() => setShowChartModal(false)}
                                maxWidth="sm"
                                fullWidth
                                PaperProps={{
                                  sx: {
                                    borderRadius: 1,
                                    boxShadow: theme.shadows[4]
                                  }
                                }}
                              >
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  pl: 3,
                                  pr: 2,
                                  py: 0.5,
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText'
                                }}>
                                  <Typography fontSize={{xs:15, md:16}}>
                                    Create New Chart Account
                                  </Typography>
                                  <IconButton
                                    onClick={() => setShowChartModal(false)}
                                    sx={{
                                      color: 'inherit',
                                      '&:hover': {
                                        bgcolor: alpha('#fff', 0.1)
                                      }
                                    }}
                                  >
                                    {getIcon('CloseIcon')}
                                  </IconButton>
                                </Box>
                                <Box>
                                  <ChartAccountForm
                                    initial={undefined}
                                    onSuccess={OnSuccess}
                                  />
                                </Box>
                              </AppDialog>
                            }
                            showModal={showChartModal}
                            setShowModal={setShowChartModal}
                            required
                          />
                        )}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  onClick={handleModalClose}
                  disabled={mutation.isPending}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending}
                  color="primary"
                  startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {mutation.isPending ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </Button>
              </Box>
            </Box>
          </Box>
        </AppDialog>
      } />
    </>
  )
}

export default TaxForm