import React, { ChangeEvent } from 'react';
import {
  Box, Typography, IconButton, TextField, Select, MenuItem, Button,
  Grid, Paper, Stack, SelectChangeEvent, FormControl, InputLabel, FormHelperText,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { NumericFormat } from 'react-number-format';
import { invoiceexpense, IInvoice } from '@/types';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { calculateexpenseAmount, serviceGetQuery } from '@/utils/calculateInvoiceAndBillSummary';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { NumericInput } from '../ui';

const columnSize = {
  service: 2,
  description: 2.5,
  tax: 1.5,
  account: 2,
  qty: 1,
  rate: 1,
  discount: 1,
  amount: 1.5,
  delete: 0.5,
};

interface ItemsTableProps {
  handleTaxModalShow: () => void;
  handleProductServiceModalShow: () => void;
  type: 'invoice' | 'bill';
}

const ItemsTable: React.FC<ItemsTableProps> = ({ handleTaxModalShow, handleProductServiceModalShow, type }) => {
  const form = useFormContext<IInvoice>();
  const { watch, setValue, formState: { errors, isSubmitted }, control, clearErrors } = form;
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "expense"
  });
  const productServiceArray = watch("productServiceArray");
  const fetchItemServices = async () => {
    try {
      const response = await apiService.getProductServiceData();
      setValue("productServiceArray", response.data);
      return response.data;
    } catch (err) {
      setValue("productServiceArray", []);
      return [];
    }
  };

  useQuery({
    queryKey: ['productService'],
    queryFn: fetchItemServices,
  });

  const newExpense: invoiceexpense = {
    productservice: "", description: "", qty: 0, rate: 0, tax: "", amount: 0, readonly: false
  };

  const handleExpenseChange = (index: number, field: keyof invoiceexpense) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const value = field === 'qty' || field === 'rate' || field === 'amount'
      ? Number(e.target.value) || 0
      : e.target.value;
    if (field == "productservice" && fields[index].productservice === value) {
      toast.error("Service already exist");
      return;
    }

    const currentExpense = fields[index];
    let additionalUpdates = {};
    if (field == "productservice" && value) {
      const isExist = productServiceArray.find((item) => item._id == value)
      if (isExist) {
        additionalUpdates = {
          rate: isExist.ProductRate || 0,
          description: isExist.description || ""
        };
      }
    }
    const updatedExpense = {
      ...currentExpense,
      [field]: value,
      ...additionalUpdates
    };
    update(index, updatedExpense);
    // Clear errors for this field when user makes changes
    clearErrors(`expense.${index}.${field}`);
    // Also update the form value to ensure proper state management
    // setValue(`expense.${index}`, updatedExpense);
  };
  const handleAddExpense = () => {
    append(newExpense);
  };

  const handleRemoveExpense = (index: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      remove(index);
    }
  };

  return (
    <Grid item xs={12}>
      <Box>
        <Stack spacing={2}>
          {fields.map((expense, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 0,
                borderRadius: 0.5,
                border: 'none',
                //borderColor: '#ddd',
              }}
            >
              <Grid container spacing={1.5} alignItems="start">
                <React.Fragment>
                  {/* Service Field */}
                  <Grid item xs={12} md={columnSize.service} lg={columnSize.service}>
                    <Box>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`productservice-label-${index}`}>Product/Service</InputLabel>
                        <Select
                          labelId={`productservice-label-${index}`}
                          value={expense.productservice}
                          label="Product/Service"
                          onChange={handleExpenseChange(index, 'productservice')}
                          disabled={expense.readonly}
                          error={Boolean(errors?.expense?.[index]?.productservice)}
                          variant="outlined"
                          renderValue={(selected) => {
                            // If this is a load expense, show the label instead of the service name
                            if (expense.isloadExpenses && expense.label) {
                              return expense.label;
                            }
                            // Otherwise, find and show the service name
                            const service = (watch('productServiceArray') || []).find(s => s._id === selected);
                            return service ? service.name : '';
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select Product/Service
                          </MenuItem>
                          <MenuItem value="" onClick={handleProductServiceModalShow}>
                            <Typography color="primary" sx={{ fontWeight: 500, fontSize: '14px' }}>
                              + Add New Product/Service
                            </Typography>
                          </MenuItem>
                          {(watch('productServiceArray') || [])?.map((service) => (
                            <MenuItem key={service._id} value={service._id}>
                              {service.name}
                              {service.category == "inventory" && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  (Stock: {service.currentLevel})
                                </Typography>
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {isSubmitted && errors?.expense?.[index]?.productservice && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px', display:'block', lineHeight:1.2 }}>
                          {errors.expense[index].productservice.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Account Field */}
                  <Grid item xs={12} md={columnSize.account} lg={columnSize.account}>
                    <TextField size='small'
                      fullWidth
                      label="Account"
                      value={serviceGetQuery(expense.productservice, form as any, type)}
                      disabled={true}
                      variant="outlined"
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
                        },
                      }}
                    />
                  </Grid>

                  {/* Quantity Field */}
                  <Grid item xs={12} md={columnSize.qty} lg={columnSize.qty}>
                    <Box>
                      <NumericInput size='small'
                        fullWidth
                        label="Qty"
                        value={expense.qty}
                        error={Boolean(errors?.expense?.[index]?.qty)}
                        onChange={(value) => {
                          const syntheticEvent = {
                            target: { value: value || 0 }
                          } as unknown as ChangeEvent<HTMLInputElement>;
                          handleExpenseChange(index, 'qty')(syntheticEvent);
                        }}
                        disabled={expense.readonly}
                        variant="outlined"
                        inputProps={{ min: 0, step: 1 }}
                        decimalScale={0}
                        allowNegative={false}
                      />
                      {isSubmitted && errors?.expense?.[index]?.qty && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px', display:'block', lineHeight:1.2}}>
                          {errors.expense[index].qty.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Rate Field */}
                  <Grid item xs={12} md={columnSize.rate} lg={columnSize.rate}>
                    <Box>
                      <NumericFormat
                        customInput={TextField}
                        fullWidth
                        size="small"
                        label="Rate"
                        value={expense.rate}
                        error={Boolean(errors?.expense?.[index]?.rate)}
                        onValueChange={(values: { floatValue?: number; formattedValue: string; value: string }) => {
                          // Create a proper synthetic event that matches the expected interface
                          const syntheticEvent = {
                            target: { value: values.floatValue || 0 }
                          } as unknown as ChangeEvent<HTMLInputElement>;
                          handleExpenseChange(index, 'rate')(syntheticEvent);
                        }}
                        disabled={expense.readonly}
                        variant="outlined"
                        thousandSeparator={false}
                        decimalScale={2}
                        allowNegative={true}
                        inputProps={{ step: 0.01 }}
                      />
                      {isSubmitted && errors?.expense?.[index]?.rate && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px', display:'block', lineHeight:1.2 }}>
                          {errors.expense[index].rate.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Tax Field */}
                  <Grid item xs={12} md={columnSize.tax} lg={columnSize.tax}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`tax-label-${index}`} shrink>Tax</InputLabel>
                      <Select
                        labelId={`tax-label-${index}`}
                        value={expense.tax || ""}
                        label="Tax"
                        onChange={handleExpenseChange(index, 'tax')}
                        disabled={expense.readonly}
                        error={Boolean(errors?.expense?.[index]?.tax)}
                        variant="outlined"
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return "No Tax"
                          }
                          const tax = (watch("taxArray") || []).find(t => t._id === selected);
                          return tax ? `${tax.label} (${tax.value}%)` : "No Tax Selected";
                        }}
                      >

                        <MenuItem onClick={handleTaxModalShow}>
                          <Typography color="primary" sx={{ fontWeight: 500, fontSize: '14px' }}>
                            + Add New Tax
                          </Typography>
                        </MenuItem>

                        <MenuItem value="" sx={{ fontSize: '14px' }}>
                          No Tax
                        </MenuItem>

                        {(watch("taxArray") || []).length === 0 && (
                          <MenuItem disabled>
                            <Typography color="text.secondary" fontSize="13px">
                              No Tax Available
                            </Typography>
                          </MenuItem>
                        )}

                        {(watch("taxArray") || []).map((service) => (
                          <MenuItem key={service._id} value={service._id}>
                            {`${service.label} (${service.value}%)`}
                          </MenuItem>
                        ))}
                      </Select>

                      {isSubmitted && errors?.expense?.[index]?.tax && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px' }}>
                          {errors.expense[index].tax.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Amount Field */}
                  <Grid item xs={12} md={columnSize.amount} lg={columnSize.amount}>
                    <Box>
                      <TextField size='small'
                        fullWidth
                        label="Amount"
                        error={Boolean(errors?.expense?.[index]?.amount)}
                        value={(calculateexpenseAmount(expense, watch())).toFixed(2)}
                        disabled={true}
                        variant="outlined"
                        sx={{
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: 'rgba(0, 0, 0, 0.8)',
                            fontWeight: 500,
                          },
                        }}
                        InputProps={{
                          startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                        }}
                      />
                      {isSubmitted && errors?.expense?.[index]?.amount && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px' }}>
                          {errors.expense[index].amount.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Description Field */}
                  <Grid item xs={12} md={columnSize.description} lg={columnSize.description}>
                    <Box>
                      <TextField size='small'
                        fullWidth
                        label="Description"
                        error={Boolean(errors?.expense?.[index]?.description)}
                        value={expense.description}
                        onChange={handleExpenseChange(index, 'description')}
                        disabled={expense.readonly}
                        variant="outlined"
                        multiline
                        maxRows={2}
                      />
                      {isSubmitted && errors?.expense?.[index]?.description && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '12px' }}>
                          {errors.expense[index].description.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Delete Button */}
                  <Grid item xs={12} md={columnSize.delete} lg={columnSize.delete}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems:'center', minHeight:'34px'}}>
                      <IconButton
                        color="error"
                        disabled={expense.readonly}
                        onClick={() => handleRemoveExpense(index)}
                        size="small"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'error.contrastText',
                          padding: '4px',
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '14px' }} />
                      </IconButton>
                    </Box>
                  </Grid>
                </React.Fragment>
              </Grid>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddExpense}
              size="small"
              sx={{
                minWidth: 150,
                borderRadius: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                px: 1.5,
                py: 0.4,
                '& .MuiButton-startIcon': {
                  marginRight: '3px',
                },
              }}
            >
              Add Product/Service
            </Button>
          </Box>
        </Stack>
        {/* Overall Expense Error Display */}
        {isSubmitted && errors.expense && typeof errors.expense.message === 'string' && (
          <Box sx={{ mb: 2 }}>
            <Alert color="error" severity="error" sx={{ width: 'fit-content', mt: 2 }}>
              {errors.expense.message}
            </Alert>
          </Box>
        )}
      </Box>
    </Grid>
  );
};

export default ItemsTable;
