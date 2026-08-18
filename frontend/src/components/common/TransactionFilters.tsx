import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Typography,
  Grid,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers';
import { Moment } from 'moment';
import moment from 'moment';
import { FilterList as FilterIcon, Clear as ClearIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { emailStatus, PaymentStatus } from '@/types';

export interface TransactionFiltersType {
  search: string;
  paymentStatus: PaymentStatus;
  emailStatus?: emailStatus;
  fromDate: Moment | null;
  toDate: Moment | null;
  minAmount: string;
  maxAmount: string;
  // Payment-specific fields
  paymentType?: string;
  status?: string;
  paymentMethod?: string;
  depositTo?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersType;
  onFiltersChange: (filters: TransactionFiltersType) => void;
  onClearFilters: () => void;
  showEmailStatus?: boolean;
  searchPlaceholder?: string;
  type?: 'invoice' | 'bill' | 'estimate' | 'payments';
  // Payment-specific props
  paymentTypeOptions?: { value: string; label: string }[];
  statusOptions?: { value: string; label: string }[];
  paymentMethodOptions?: { value: string; label: string }[];
  depositToOptions?: { value: string; label: string }[];
  // Optional controlled expanded state
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due Soon' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'partial_late', label: 'Partially Late' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
];

const emailStatusOptions: { value: emailStatus; label: emailStatus }[] = [
  { value: "Save", label: "Save" },
  { value: "Save & Send", label: 'Save & Send' },
  { value: 'Failed To Send', label: "Failed To Send" },
];

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  showEmailStatus = false,
  searchPlaceholder = 'Search by number, customer, vendor...',
  type = 'invoice',
  paymentTypeOptions = [],
  statusOptions = [],
  paymentMethodOptions = [],
  depositToOptions = [],
  expanded: controlledExpanded,
  onExpandedChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Use controlled expanded state if provided, otherwise use internal state
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleExpandedChange = (newExpanded: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const updateFilter = (key: keyof TransactionFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const getActiveFilters = () => {
    const activeFilters: { key: keyof TransactionFiltersType; label: string; value: string }[] = [];

    if (filters.search) {
      activeFilters.push({
        key: 'search',
        label: 'Search',
        value: filters.search
      });
    }

    if (filters.paymentStatus) {
      const statusOption = paymentStatusOptions.find(opt => opt.value === filters.paymentStatus);
      activeFilters.push({
        key: 'paymentStatus',
        label: 'Payment Status',
        value: statusOption?.label || filters.paymentStatus
      });
    }

    if (showEmailStatus && filters.emailStatus) {
      const statusOption = emailStatusOptions.find(opt => opt.value === filters.emailStatus);
      activeFilters.push({
        key: 'emailStatus',
        label: 'Email Status',
        value: statusOption?.label || filters.emailStatus
      });
    }

    if (filters.fromDate) {
      activeFilters.push({
        key: 'fromDate',
        label: 'From Date',
        value: filters.fromDate.format('MMM DD, YYYY')
      });
    }

    if (filters.toDate) {
      activeFilters.push({
        key: 'toDate',
        label: 'To Date',
        value: filters.toDate.format('MMM DD, YYYY')
      });
    }

    if (filters.minAmount) {
      activeFilters.push({
        key: 'minAmount',
        label: 'Min Amount',
        value: `$${filters.minAmount}`
      });
    }

    if (filters.maxAmount) {
      activeFilters.push({
        key: 'maxAmount',
        label: 'Max Amount',
        value: `$${filters.maxAmount}`
      });
    }

    // Payment-specific filters
    if (type === 'payments') {
      if (filters.paymentType) {
        const option = paymentTypeOptions.find(opt => opt.value === filters.paymentType);
        activeFilters.push({
          key: 'paymentType',
          label: 'Payment Type',
          value: option?.label || filters.paymentType
        });
      }

      if (filters.status) {
        const option = statusOptions.find(opt => opt.value === filters.status);
        activeFilters.push({
          key: 'status',
          label: 'Status',
          value: option?.label || filters.status
        });
      }

      if (filters.paymentMethod) {
        const option = paymentMethodOptions.find(opt => opt.value === filters.paymentMethod);
        activeFilters.push({
          key: 'paymentMethod',
          label: 'Payment Method',
          value: option?.label || filters.paymentMethod
        });
      }

      if (filters.depositTo) {
        const option = depositToOptions.find(opt => opt.value === filters.depositTo);
        activeFilters.push({
          key: 'depositTo',
          label: 'Deposit Account',
          value: option?.label || filters.depositTo
        });
      }
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();
  const activeFiltersCount = activeFilters.length;

  const removeFilter = (key: keyof TransactionFiltersType) => {
    const newFilters = { ...filters };

    switch (key) {
      case 'search':
        newFilters.search = '';
        break;
      case 'paymentStatus':
        newFilters.paymentStatus = '' as PaymentStatus;
        break;
      case 'emailStatus':
        newFilters.emailStatus = undefined;
        break;
      case 'fromDate':
        newFilters.fromDate = null;
        break;
      case 'toDate':
        newFilters.toDate = null;
        break;
      case 'minAmount':
        newFilters.minAmount = '';
        break;
      case 'maxAmount':
        newFilters.maxAmount = '';
        break;
      case 'paymentType':
        newFilters.paymentType = '';
        break;
      case 'status':
        newFilters.status = '';
        break;
      case 'paymentMethod':
        newFilters.paymentMethod = '';
        break;
      case 'depositTo':
        newFilters.depositTo = '';
        break;
    }

    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    handleExpandedChange(false);
    onClearFilters();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Button
            variant={expanded ? 'contained' : 'outlined'}
            size="small"
            startIcon={<FilterIcon />}
            onClick={() => handleExpandedChange(!expanded)}
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              minWidth: 'auto',
              //background:'#fff',
              fontWeight:'500',
            }}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{
                  ml: 1,
                  height: '20px',
                  fontSize: '0.75rem',
                  bgcolor: expanded ? 'rgba(255,255,255,0.3)' : 'primary.main',
                  color: expanded ? 'white' : 'white',
                }}
              />
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="text"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
              }}
            >
              Clear All
            </Button>
          )}
        </Stack>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Active Filters:
              </Typography>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.key}
                  label={`${filter.label}: ${filter.value}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => removeFilter(filter.key)}
                  deleteIcon={<CancelIcon />}
                  sx={{
                    '& .MuiChip-deleteIcon': {
                      fontSize: '15px',
                      '&:hover': {
                        color: 'error.main',
                      },
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {expanded && (
          <Box sx={{p:0, background:'transparent', border:'none', borderRadius:'0px', mt:1}}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder={searchPlaceholder}
                sx={{
                  '& .MuiInputLabel-shrink': {
                    display: 'none',
                  },
                  '& .MuiOutlinedInput-notchedOutline span': {
                    display: 'none',
                  },
                  '& .MuiInputLabel-root': {
                    lineHeight: '1em',
                    fontSize: '13px',
                  },
                  '& .MuiOutlinedInput-root': {
                    height: 30,
                  },
                  '& .MuiInputBase-input': {
                    padding: '4px 10px',
                    fontSize: '13px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '13px',
                  },
                }}
              />
              {type!=="payments" &&   <FormControl fullWidth size="small"
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiSelect-select': {
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '0px'
                    },
                  }}
                >
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={filters.paymentStatus}
                    label="Payment Status"
                    onChange={(e: SelectChangeEvent) =>
                      updateFilter('paymentStatus', e.target.value as PaymentStatus)
                    }
                  >
                    {paymentStatusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> }


                {showEmailStatus && (
                  <FormControl fullWidth size="small"
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiSelect-select': {
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '0px'
                    },
                  }}
                  >
                    <InputLabel>Email Status</InputLabel>
                    <Select
                      value={filters.emailStatus}
                      label="Email Status"
                      onChange={(e: SelectChangeEvent) =>
                        updateFilter('emailStatus', e.target.value as emailStatus)
                      }
                    >
                      {emailStatusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <DatePicker
                  label="From Date"
                  value={filters.fromDate}
                  maxDate={filters.toDate || undefined}
                  onChange={(date) => updateFilter('fromDate', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiSelect-select': {
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '0px'
                    },
                  }}
                />

                <DatePicker
                  label="To Date"
                  value={filters.toDate}
                  minDate={filters.fromDate || undefined}
                  onChange={(date) => updateFilter('toDate', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiSelect-select': {
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '0px'
                    },
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Min Amount"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter('minAmount', e.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiInputBase-input': {
                      padding: '4px 10px',
                      fontSize: '13px',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Max Amount"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter('maxAmount', e.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  sx={{
                    '& .MuiInputLabel-shrink': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline span': {
                      display: 'none',
                    },
                    '& .MuiInputLabel-root': {
                      lineHeight: '1em',
                      fontSize: '13px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: 30,
                    },
                    '& .MuiInputBase-input': {
                      padding: '4px 10px',
                      fontSize: '13px',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px',
                    },
                  }}
                />

                {/* Payment-specific filters */}
                {type === 'payments' && (
                  <>
                    <FormControl fullWidth size="small"
                      sx={{
                        '& .MuiInputLabel-shrink': {
                          display: 'none',
                        },
                        '& .MuiOutlinedInput-notchedOutline span': {
                          display: 'none',
                        },
                        '& .MuiInputLabel-root': {
                          lineHeight: '1em',
                          fontSize: '13px',
                        },
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                        },
                        '& .MuiSelect-select': {
                          fontSize: '13px',
                          padding: '4px 10px',
                          borderRadius: '0px'
                        },
                      }}
                    >
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={filters.paymentMethod || ''}
                        label="Payment Method"
                        onChange={(e: SelectChangeEvent) =>
                          updateFilter('paymentMethod', e.target.value)
                        }
                      >
                        {paymentMethodOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small"
                      sx={{
                        '& .MuiInputLabel-shrink': {
                          display: 'none',
                        },
                        '& .MuiOutlinedInput-notchedOutline span': {
                          display: 'none',
                        },
                        '& .MuiInputLabel-root': {
                          lineHeight: '1em',
                          fontSize: '13px',
                        },
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                        },
                        '& .MuiSelect-select': {
                          fontSize: '13px',
                          padding: '4px 10px',
                          borderRadius: '0px'
                        },
                      }}
                    >
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status || ''}
                        label="Status"
                        onChange={(e: SelectChangeEvent) =>
                          updateFilter('status', e.target.value)
                        }
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small"
                      sx={{
                        '& .MuiInputLabel-shrink': {
                          display: 'none',
                        },
                        '& .MuiOutlinedInput-notchedOutline span': {
                          display: 'none',
                        },
                        '& .MuiInputLabel-root': {
                          lineHeight: '1em',
                          fontSize: '13px',
                        },
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                        },
                        '& .MuiSelect-select': {
                          fontSize: '13px',
                          padding: '4px 10px',
                          borderRadius: '0px'
                        },
                      }}
                    >
                      <InputLabel>Payment Type</InputLabel>
                      <Select
                        value={filters.paymentType || ''}
                        label="Payment Type"
                        onChange={(e: SelectChangeEvent) =>
                          updateFilter('paymentType', e.target.value)
                        }
                      >
                        {paymentTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small"
                      sx={{
                        '& .MuiInputLabel-shrink': {
                          display: 'none',
                        },
                        '& .MuiOutlinedInput-notchedOutline span': {
                          display: 'none',
                        },
                        '& .MuiInputLabel-root': {
                          lineHeight: '1em',
                          fontSize: '13px',
                        },
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                        },
                        '& .MuiSelect-select': {
                          fontSize: '13px',
                          padding: '4px 10px',
                          borderRadius: '0px'
                        },
                      }}
                    >
                      <InputLabel>Deposit To</InputLabel>
                      <Select
                        value={filters.depositTo || ''}
                        label="Deposit To"
                        onChange={(e: SelectChangeEvent) =>
                          updateFilter('depositTo', e.target.value)
                        }
                      >
                        {depositToOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}

          </Stack>
          </Box>
        )}
      </Box>

    </LocalizationProvider>
  );
};

export default TransactionFilters;
