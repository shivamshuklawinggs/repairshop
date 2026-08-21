import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, FormHelperText, Dialog, DialogContent, Card, CardContent, IconButton, Tooltip, Alert, useTheme, alpha, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { IProductService } from '@/types';
import { ProductServiceData } from '@/data/ProductServiceData';
import apiService from '@/service/apiService';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProductServiceSchema } from './Schema/ProductServiceSchema';
import { CategoryType, } from '@/data/ProductServiceData';
import { useChartOfAccount } from '@/hooks/useChartOfAccount';
import FormSelect from '@/components/ui/FormSelect';
import ChartAccountForm from '../chart-accounts-service/ChartAccountForm';
import { Info as InfoIcon, Inventory as InventoryIcon, AccountBalance as AccountIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { ControlledNumericInput } from '@/components/ui/NumericInput';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';
import { IParentAccountTypeEnum } from '@/types';

const ProductServiceForm: React.FC<{ showModal: boolean, handleModalClose: () => void, editingItem: IProductService | null }> = ({ showModal, handleModalClose, editingItem }) => {
  const theme = useTheme();
  const queryClient = useQueryClient()
  const [showChartModal, setShowChartModal] = useState<boolean>(false)
  const [chartModalFilterType, setChartModalFilterType] = useState<IParentAccountTypeEnum | undefined>(undefined)
  const makeChartModalSetter = (type: IParentAccountTypeEnum): React.Dispatch<React.SetStateAction<boolean>> => {
    return (val) => {
      const next = typeof val === 'function' ? val(showChartModal) : val;
      setShowChartModal(next);
      if (next) setChartModalFilterType(type);
    };
  };
  const expenseAccount = useChartOfAccount({ type: "expense", isProductServicesPage:"1"})
  const incomeAccount = useChartOfAccount({ type: "income",isProductServicesPage:"1" })
  const inventoryAccount = useChartOfAccount({ type: "asset",isProductServicesPage:"1"})
  const { watch, control, reset, handleSubmit, setValue, getValues, formState: { errors } } = useForm<IProductService>({
    resolver: yupResolver(ProductServiceSchema) as any,
    defaultValues: {
      isUpdate: editingItem?._id ? true : false,
      name: editingItem?.name || '',
      category: editingItem?.category as CategoryType,
      description: editingItem?.description || '',
      incomeAccount: editingItem?.incomeAccount,
      reorderStock: editingItem?.reorderStock || 0,
      OpeningStock: editingItem?.OpeningStock || 0,
      currentLevel: editingItem?.currentLevel || 0,
      inventoryAccount: editingItem?.inventoryAccount,
    }
  });
  const mutation = useMutation({
    mutationFn: async (data: IProductService) => {
      if (editingItem) {
        return await apiService.updateProductServiceData(editingItem._id, data)
      } else {
        return await apiService.createProductServiceData(data)
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? "Product Service Updated Successfully" : "Product Service Added Successfully")
      queryClient.refetchQueries({ queryKey: ["productService"] })
      handleModalClose();
    },
    onError: (error: any) => {
      console.warn(error)
      toast.error(error.message || "Failed to add product service")
    }
  });

  const onSubmit = async (data: IProductService) => {
    mutation.mutate(data);
  };
  useEffect(() => {
    if (editingItem) {
      const data = {
        ...editingItem,
        isUpdate: true
      }
      reset(data as IProductService)
      return
    } else if (!editingItem) {
      reset({
        name: '',
        category: '' as CategoryType,
        description: '',
        incomeAccount: '',
        reorderStock: 0,
        OpeningStock: 0,
        currentLevel: 0,
        inventoryAccount: '',
        isUpdate: false
      })
      return
    }
  }, [editingItem, showModal])
  const handleChartAccountSuccess = () => {
    setShowChartModal(false)
    queryClient.invalidateQueries({ queryKey: ['chartAccounts'] })
  }
  const OpeningStocjDisable = () => {
    const isUpdate = watch("isUpdate")
    const oldOpeningStock = editingItem?.OpeningStock || 0
    const category = watch("category")
    if (isUpdate && category == "inventory" && oldOpeningStock > 0) {
      return true
    }
    if (isUpdate && category == "inventory" && oldOpeningStock == 0) {
      return false
    }
    if (!isUpdate) {
      return false
    }
    return true
  }
  const ShowCurrentLevel = () => {
    const isUpdate = watch("isUpdate")
    const oldOpeningStock = editingItem?.OpeningStock || 0
    const category = watch("category")
    if (isUpdate && category == "inventory" && oldOpeningStock > 0) {
      return editingItem?.currentLevel || 0
    }
    if (isUpdate && category == "inventory" && oldOpeningStock == 0) {
      return watch("OpeningStock")
    }
    if (!isUpdate) {
      return watch("OpeningStock")
    }
    return editingItem?.currentLevel || 0
  }
  const category = watch("category");
  const getDefaultAccountId = (options: { value: string; label: string }[], keywords: string[]) => {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const exact = options.find((o) => lowerKeywords.includes(o.label.toLowerCase()));
    if (exact) return exact.value;
    const startsWith = options.find((o) => lowerKeywords.some((k) => o.label.toLowerCase().startsWith(k)));
    if (startsWith) return startsWith.value;
    const includes = options.find((o) => lowerKeywords.some((k) => o.label.toLowerCase().includes(k)));
    if (includes) return includes.value;
    return options[0]?.value || '';
  };

  useEffect(() => {
    if (editingItem?._id) return;
    if (incomeAccount.chartAccountOptions.length && !getValues('incomeAccount')) {
      const defaultIncome = getDefaultAccountId(incomeAccount.chartAccountOptions, ['Sales']);
      if (defaultIncome) setValue('incomeAccount', defaultIncome, { shouldValidate: true });
    }
    if (expenseAccount.chartAccountOptions.length && !getValues('expenseAccount')) {
      const defaultExpense = getDefaultAccountId(expenseAccount.chartAccountOptions, ['Expense']);
      if (defaultExpense) setValue('expenseAccount', defaultExpense, { shouldValidate: true });
    }
    if (category === 'inventory' && inventoryAccount.chartAccountOptions.length && !getValues('inventoryAccount')) {
      const defaultInventory = getDefaultAccountId(inventoryAccount.chartAccountOptions, ['Inventory']);
      if (defaultInventory) setValue('inventoryAccount', defaultInventory, { shouldValidate: true });
    }
  }, [incomeAccount.chartAccountOptions, expenseAccount.chartAccountOptions, inventoryAccount.chartAccountOptions, category, getValues, setValue, editingItem]);

  useEffect(() => {
    if (category !== 'inventory') {
      setValue('inventoryAccount', '', { shouldValidate: true });
    }
  }, [category, setValue]);

  return (
    <AppDialog
      open={showModal}
      onClose={handleModalClose}
      maxWidth="md"
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
        pl: 3,
        pr: 2,
        py: 0.5,
        bgcolor: '#fff',
        color: '#101721',
        position: 'relative',
        borderBottom:'1px solid #ddd',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* <Box sx={{
            p: 0.8,
            borderRadius: 2,
            bgcolor: alpha('#fff', 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <InventoryIcon sx={{ fontSize: 14 }} />
          </Box> */}
          <Typography fontSize={{xs:15, md:16}} sx={{pl:0.5, fontWeight:'600'}}>
            {editingItem ? 'Edit Product/Service' : 'Add New Product/Service'}
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

      <DialogContent sx={{ px:{xs:2, md:3}, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Information Section */}
          <Card
            variant="outlined"
            sx={{
              p: 0,
              borderRadius: 0,
              border:'none',
            }}
          >
            <CardContent sx={{ p:0 }} style={{paddingBottom:'0px'}}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {/* <DescriptionIcon sx={{ fontSize: 18, color: 'primary.main' }} /> */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Basic Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField size='small'
                        {...field}
                        fullWidth
                        label="Product/Service Name"
                        placeholder="Enter product or service name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl size='small' fullWidth error={!!errors.category}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          {...field}
                          label="Category"
                        >
                          {
                            ProductServiceData.category.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {/* {item.value === 'inventory' && <InventoryIcon sx={{fontSize:'13px'}}/>} */}
                                  {item.value === 'inventory' && null}
                                  {item.label}
                                </Box>
                              </MenuItem>
                            ))
                          }
                        </Select>
                        <FormHelperText>{errors.category?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField size='small'
                        {...field}
                        fullWidth
                        label="Description"
                        placeholder="Enter product or service description"
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        multiline
                        rows={1}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          {/* Account Details Section */}
          <Card
            variant="outlined"
            sx={{
              p: 0,
              borderRadius: 0,
              border:'none',
              mt:2.5,
            }}
          >
            <CardContent sx={{ p:0 }} style={{paddingBottom:'0px'}}>
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3, mt:1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Account Details
                </Typography>
                <Tooltip title="Configure the accounts for tracking income, expenses, and inventory">
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box> */}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="incomeAccount"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label="Income Account"
                        options={incomeAccount.chartAccountOptions}
                        value={incomeAccount.chartAccountOptions.find((option) => option.value === field.value) || null}
                         onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                        placeholder="Select Income Account"
                        error={errors.incomeAccount?.message as string}
                        helperText={errors.incomeAccount?.message as string}
                        addNewLabel="+ Create New Chart Account"
                        showModal={showChartModal}
                        setShowModal={makeChartModalSetter('income')}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="expenseAccount"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label="Expense Account"
                        options={expenseAccount.chartAccountOptions}
                        value={expenseAccount.chartAccountOptions.find((option) => option.value === field.value) || null}
                         onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                        placeholder="Select Expense Account"
                        error={errors.expenseAccount?.message as string}
                        helperText={errors.expenseAccount?.message as string}
                        addNewLabel="+ Create New Chart Account"
                        showModal={showChartModal}
                        setShowModal={makeChartModalSetter('expense')}
                      />
                    )}
                  />
                </Grid>
          {/* Inventory Management Section */}
          {
                  watch("category") === "inventory" && (
                    <Card
                      variant="outlined"
                      sx={{
                        p: 0,
                        borderRadius: 0,
                        border:'none',
                      }}
                    >
                      <CardContent style={{paddingBottom:'0px'}}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {/* <InventoryIcon sx={{ fontSize: 18, color: 'primary.main' }} /> */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Inventory Management
                          </Typography>
                        </Box>

                        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 0.5 }}>
                          <Typography variant="body2">
                            <strong>Inventory Management:</strong> Configure stock levels and tracking for this product.
                          </Typography>
                        </Alert>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <Controller
                              name="OpeningStock"
                              control={control}
                              render={({ field }) => (
                                <TextField size='small'
                                  {...field}
                                  fullWidth
                                  type='number'
                                  label="Opening Stock"
                                  placeholder="0"
                                  disabled={OpeningStocjDisable()}
                                  error={!!errors.OpeningStock}
                                  helperText={OpeningStocjDisable() ? "Cannot modify opening stock after initial entry" : errors.OpeningStock?.message}

                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <TextField size='small'
                              fullWidth
                              label="Current Level"
                              value={ShowCurrentLevel()}
                              disabled={true}
                              placeholder="0"
                              helperText="Automatically calculated"
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Controller
                              name="reorderStock"
                              control={control}
                              render={({ field }) => (
                                <TextField size='small'
                                  {...field}
                                  fullWidth
                                  type='number'
                                  label="Reorder Level"
                                  placeholder="0"
                                  error={!!errors.reorderStock}
                                  helperText={errors.reorderStock?.message || "Alert when stock reaches this level"}
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <ControlledNumericInput
                              name="ProductRate"
                              control={control}
                              label="Unit Price"
                              fullWidth
                              decimalScale={2}
                              allowNegative={false}
                              thousandSeparator={false}
                              placeholder="0.00"
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name="inventoryAccount"
                              control={control}
                              render={({ field }) => (
                                <FormSelect
                                  label="Inventory Account"
                                  options={inventoryAccount.chartAccountOptions}
                                  value={inventoryAccount.chartAccountOptions.find((option) => option.value === field.value) || null}
                                  onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
                                  placeholder="Select Inventory Account"
                                  error={errors.inventoryAccount?.message as string}
                                  helperText={errors.inventoryAccount?.message as string}
                                  addNewLabel="+ Create New Chart Account"
                                  showModal={showChartModal}
                                  setShowModal={makeChartModalSetter('asset')}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )
                }
              </Grid>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleModalClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : (editingItem ? null : <InventoryIcon style={{fontSize:'14px'}}/>)}
            >
              {mutation.isPending ? "Saving..." : (editingItem ? 'Update' : 'Create')}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      {/* Chart Account Modal */}
      <AppDialog
        open={showChartModal}
        onClose={() => setShowChartModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: theme.shadows[4],
            overflowY: 'auto'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pl: 2.5,
          pr: 1,
          py: 0.4,
          bgcolor: '#fff',
          color: '#101721',
          borderBottom:'1px solid #ddd',
        }}>
          <Typography fontSize={15} sx={{ fontWeight: 600 }}>
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
            onSuccess={handleChartAccountSuccess}
            filterType={chartModalFilterType}
          />
        </Box>
      </AppDialog>
    </AppDialog>
  );
};

export default ProductServiceForm;
