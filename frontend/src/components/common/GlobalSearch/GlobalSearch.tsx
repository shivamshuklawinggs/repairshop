import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  TextField,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  Badge,
  Button,
  Menu,
  MenuItem,
  Modal,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  FilterAlt as FilterAltIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '@/redux/store';
import {
  toggleSearch,
  setSearchOpen,
  setAdvancedSearchOpen,
  setSearchQuery,
  clearFilters,
  addToSearchHistory,
  removeFromSearchHistory,
  setSearching,
  setLastSearchResults,
  setSearchType,
  clearSearch
} from '@/redux/Slice/globalSearchSlice';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import {
  IVendorBill,
  ICarrier,
  ICustomer,
  IAccountsCustomerView,  PaymentType,

} from '@/types';
import { hasAccess } from '@/hooks/authUtils';
import { paths } from '@/utils/paths';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';
import CustomerInvoiseForm from '@/pages/carrier-service/VendorBills/CustomerInvoiseForm';
import { initialInvoiseData } from '@/pages/carrier-service/VendorBills/genearateInvoiceSchema';
import { getIcon } from '@/components/common/icons/getIcon'
import AppModalDialog from '@/components/ui/AppModalDialog';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {xs:'95%', md:'80%'},
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: { xs: 2, md: 2.5 },
  pr: { xs: 2, md: 3.5 },
  pb: { xs: 2, md: 3.5 },
  pl: { xs: 2, md: 3.5 },
  overflow: 'auto',
  borderRadius: '16px',
};

const GlobalSearch: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isSearchOpen,
    searchQuery,
    filters,
    searchHistory,
    searchType
  } = useSelector((state: RootState) => state.globalSearch);

  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const anchorEl = useRef<HTMLDivElement>(null);

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | ICarrier | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [expandedAddresses, setExpandedAddresses] = useState<Record<string, boolean>>({});
  const [currentLocationModalOpen, setCurrentLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<string>('');

  const currentUser = useSelector((state: RootState) => state.user);

  // React Query for unified financial search
  const { data: searchData, refetch: refetchSearch, isLoading, error } = useQuery({
    queryKey: ['globalSearch', localQuery, filters, searchType],
    queryFn: () => {
      const searchParams = {
        search: localQuery || undefined,
        ...filters,
        limit: 5
      };

      return apiService.getUnifiedFinancialData(searchParams);
    },
    enabled: !!localQuery && isSearchOpen
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingInvoice?._id) {
        return await apiService.updateAccountBill(editingInvoice._id, data);
      }
      return await apiService.generateAccountBill(data);
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || `Invoice ${editingInvoice?._id ? 'updated' : 'created'} successfully`);
      setShowInvoiceModal(false);
      setEditingInvoice(initialInvoiseData);
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to ${editingInvoice?._id ? 'update' : 'create'} invoice`);
    }
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) => apiService.deleteVendor(vendorId),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors', 'globalSearch'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });

  // Handle query success and error
  React.useEffect(() => {
    if (searchData) {
      dispatch(setLastSearchResults(searchData));
      if (localQuery) {
        dispatch(addToSearchHistory(localQuery));
        dispatch(setSearchQuery(localQuery));
      }
    }
  }, [searchData, localQuery, dispatch]);

  React.useEffect(() => {
    if (error) {
      toast.error((error as any)?.message || 'Search failed');
    }
  }, [error]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (query: string) => {
    setLocalQuery(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      refetchSearch();
    }
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    dispatch(clearSearch());
  };

  const handleFilterReset = () => {
    dispatch(clearFilters());
  };

  const handleHistoryItemClick = (query: string) => {
    setLocalQuery(query);
    dispatch(setSearchQuery(query));
    refetchSearch();
  };



 
  const handleEditCustomer = (customer: IAccountsCustomerView) => {
    setSelectedCustomer({ ...customer } as ICustomer);
    dispatch(setSearchOpen(false));
  };

  const handleEditCarrier = (customer: ICarrier) => {
    setSelectedCustomer({ ...customer } as ICarrier);
    dispatch(setSearchOpen(false));
  };

  const handleDeleteVendor = useCallback(
    (customerId: string) => {
      if (!window.confirm('Are you sure you want to delete this customer?')) return;
      deleteVendorMutation.mutate(customerId);
    },
    [deleteVendorMutation]
  );

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this customer?'))
        return;
      await apiService.deleteAccountsCustomer(customerId);
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete customer');
    }
  };



  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any, type: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
    setSelectedItemType(type);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
    setSelectedItemType('');
  };

  const getPrimaryClickAction = (item: any, type: string) => {
    switch (type) {
      case 'invoices':
        return () => navigate(`${paths.editinvoice}/${item._id}`);
      case 'bills':
        return () => navigate(`${paths.editbill}/${item._id}`);
      case 'payments':
        return () => {
          if (item.PaymentType === PaymentType.invoice) {
            navigate(`${paths.recievedpayment}/${item._id}`);
          } else if (item.PaymentType === PaymentType.bill) {
            navigate(`${paths.recievedbill}/${item._id}`);
          }
          dispatch(setSearchOpen(false));
        };
      case 'customers':
        return () => {
          if (hasAccess(["accounting"], "view", currentUser)) {
            navigate(paths.customertransactionlist + '/' + item._id);
            dispatch(setSearchOpen(false));
          }
        };
   
      case 'carriers':
        return () => {
          if (hasAccess(["accounting"], "view", currentUser)) {
            navigate(paths.vendortransactionlist + '/' + item._id);
            dispatch(setSearchOpen(false));
          }
        };
      default:
        return null;
    }
  };

  const getEntityActions = (item: any, type: string) => {
    const actions = [];

    switch (type) {
      case 'invoices':
        actions.push({ label: 'Edit', icon: 'edit', onClick: () => navigate(`${paths.editinvoice}/${item._id}`) });
        break;
      case 'bills':
        actions.push({ label: 'Edit', icon: 'edit', onClick: () => navigate(`${paths.editbill}/${item._id}`) });
        break;
      case 'payments':
        actions.push({
          label: 'View Details', icon: 'visibility', onClick: () => {
            if (item.PaymentType === PaymentType.invoice) {
              navigate(`${paths.recievedpayment}/${item._id}`);
            } else if (item.PaymentType === PaymentType.bill) {
              navigate(`${paths.recievedbill}/${item._id}`);
            }
            dispatch(setSearchOpen(false));
          }
        });
        break;
      case 'customers':
        if (hasAccess( ["accounting"] , "update", currentUser)) {
          actions.push({ label: 'Edit', icon: 'edit', onClick: () => handleEditCustomer(item) });
        }
        break;
    
      case 'carriers':
        if (hasAccess( ["accounting"] , "update", currentUser)) {
          actions.push({ label: 'Edit', icon: 'edit', onClick: () => handleEditCarrier(item) });
        }
        break;
    }

    return actions.filter(Boolean);
  };

  const formatSearchResults = (data: any) => {
    if (!data?.data) return [];

    const results = [];

    if (data.data.invoices?.data?.length > 0) {
      results.push({
        type: 'invoices',
        count: data.data.invoices.count,
        items: data.data.invoices.data
      });
    }

    if (data.data.bills?.data?.length > 0) {
      results.push({
        type: 'bills',
        count: data.data.bills.count,
        items: data.data.bills.data
      });
    }

    if (data.data.payments?.data?.length > 0) {
      results.push({
        type: 'payments',
        count: data.data.payments.count,
        items: data.data.payments.data
      });
    }

    if (data.data.customers?.data?.length > 0) {
      results.push({
        type: 'customers',
        count: data.data.customers.count,
        items: data.data.customers.data
      });
    }
    if (data.data.carriers?.data?.length > 0) {
      results.push({
        type: 'carriers',
        count: data.data.carriers.count,
        items: data.data.carriers.data
      });
    }

    return results;
  };

  const searchResults = formatSearchResults(searchData);

  return (
    <>
      <Box
        ref={anchorEl}
        sx={{
          width: '100%',
          maxWidth: 500,
          visibility: isSearchOpen ? 'hidden' : 'visible',
          height: isSearchOpen ? 0 : 'auto',
          overflow: 'hidden'
        }}
      >
        <TextField
          inputRef={searchInputRef}
          fullWidth
          size="small"
          placeholder="Search invoices, bills, payments, customers..."
          value={localQuery}
          onClick={() => dispatch(toggleSearch())}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              height: { xs: '25px', md: '30px' },
              width:{ xs: '45px', md: '100%' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: localQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Popover
        open={isSearchOpen}
        anchorEl={anchorEl.current}
        onClose={() => dispatch(setSearchOpen(false))}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: 600, maxHeight: 600 }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search invoices, bills, payments, customers..."
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  height: '36px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: localQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </form>

          {/* Advanced Search Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={() => {
                dispatch(setSearchOpen(false));
                navigate('/advanced-search');
              }}
            >
              Advanced Search
              {Object.keys(filters).length > 0 && (
                <Chip label={Object.keys(filters).length} size="small" color="primary" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
              )}
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button size="small" onClick={handleFilterReset} color='primary'>Clear Filters</Button>
            )}
          </Box>

          {/* Search Results */}
          <Box sx={{ mt: 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : localQuery ? (
              searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <Box key={index}>
                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: '700' }}>
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)} ({result.count} results)
                    </Typography>
                    <List sx={{ pt: 0 }} dense>
                      {result.items.map((item: any, itemIndex: number) => {
                        const actions = getEntityActions(item, result.type);
                        const primaryAction = getPrimaryClickAction(item, result.type);
                        return (
                          <ListItem
                            key={itemIndex}
                            component="div"
                            onClick={primaryAction || undefined}
                            secondaryAction={
                              actions.length > 0 && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuClick(e, item, result.type)}
                                >
                                  <MoreVertIcon color='primary' sx={{ fontSize: '20px' }} />
                                </IconButton>
                              )
                            }
                            sx={{
                              cursor: primaryAction ? 'pointer' : 'default',
                              py: 0,
                              '&:hover': { bgcolor: primaryAction ? 'action.hover' : 'transparent' }
                            }}
                          >
                            <ListItemText sx={{ my: 0.5 }}
                              primary={item.invoiceNumber || item.BillNumber || item.referenceNo || item.company || '—'}
                              secondary={`${item.totalAmount != null ? '$' + item.totalAmount : item.amount != null ? '$' + item.amount : ''} ${item.status ? '· ' + item.status : ''}`.trim() || 'N/A'}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                    {index < searchResults.length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <Typography sx={{ textAlign: 'center', p: 2, fontSize: '15px' }}>
                  No results found for "{localQuery}"
                </Typography>
              )
            ) : searchHistory.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <HistoryIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /> Recent Searches
                </Typography>
                <List dense>
                  {searchHistory.map((query: string, index: number) => (
                    <ListItem
                      key={index}
                      component="div"
                      onClick={() => handleHistoryItemClick(query)}
                      secondaryAction={
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeFromSearchHistory(query));
                          }}
                        >
                          <ClearIcon sx={{ fontSize: '18px' }} color='primary' />
                        </IconButton>
                      }
                      sx={{ py: 0, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <ListItemText primary={query} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary', fontSize: '14px' }}>
                Start typing to search across all financial data
              </Typography>
            )}
          </Box>
        </Box>
      </Popover>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedItem && getEntityActions(selectedItem, selectedItemType).map((action: any, index: number) => (
          <MenuItem
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              handleMenuClose();
            }}
            sx={{
              '& svg': {
                fontSize: 16
              }
            }}
          >
            {getIcon(action.icon)}
            <Typography sx={{ ml: 1, fontSize: '14px' }}>{action.label}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Invoice Modal */}
      <AppModalDialog style={{backdropFilter:'blur(3px)'}}
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setEditingInvoice(initialInvoiseData);
        }}
        aria-labelledby="invoice-modal-title"
        aria-describedby="invoice-modal-description"
      >
        <Box sx={modalStyle}>
          <DialogActions className='dialog-close'>
            <Button onClick={() => setShowInvoiceModal(false)}>
              {getIcon('CloseIcon')}
            </Button>
          </DialogActions>
          <Typography id="invoice-modal-title" variant="h6" component="h2" sx={{ mb:0}}>
            {editingInvoice?._id ? 'Edit Bill' : 'Create Bill'}
          </Typography>
          <CustomerInvoiseForm
            initialData={editingInvoice as IVendorBill}
            onSubmit={createInvoiceMutation as any}
            loading={createInvoiceMutation.isPending}
          />
        </Box>
      </AppModalDialog>

      {/* Customer/Carrier Modal */}
      <UniversalEntityForm
        open={Boolean(selectedCustomer)}
        onClose={() => {
          queryClient.invalidateQueries({ queryKey: ['vendors', 'globalSearch'] });
          setSelectedCustomer(null);
        }}
        id={selectedCustomer && selectedCustomer._id ? selectedCustomer._id : ""}
        entityType={ "vendor"}
      />

    
    </>
  );
};

export default GlobalSearch;
