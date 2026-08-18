import { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
  Box,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { ICarrier, ICustomer } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useUSDOTForCarrier, useGetUsDotDataForCustomer } from '@/hooks/useGetUsDotData';
import { Search as FaSearch } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { EntityType } from '@/components/common/UniversalEntityForm';
import { useAppSelector } from '@/redux/store';
import UsDotField from './commonFields/UsDotField';
import McNUmberFiled from './commonFields/McNUmberFiled';

interface CompanySectionProps {
  entity: EntityType
  localUsdot?: string;
  setLocalUsdot?: (usdot: string) => void;
  showUSDOT?: boolean;
  showMCNumber?: boolean;
  showRate?: boolean;
  showNickName?: boolean;
  showDisplayName?: boolean;
  showMobileNo?: boolean;
  showFax?: boolean;
  showOther?: boolean;
  showWebsite?: boolean;
  showNameToPrintOnCheck?: boolean;
  showIsSubCustomer?: boolean;
  showIsSubVendor?: boolean;
  showAddress?: boolean;
  id?: string;
}

const CompanySection: React.FC<CompanySectionProps> = ({
  entity,
  localUsdot,
  setLocalUsdot,
  showUSDOT = true,
  showMCNumber = true,
  showRate = true,
  showNickName = false,
  showDisplayName = false,
  showMobileNo = false,
  showFax = false,
  showOther = false,
  showWebsite = false,
  showNameToPrintOnCheck = false,
  showIsSubCustomer = false,
  showIsSubVendor = false,
  showAddress = true,
  id
}) => {
  const form = useFormContext<ICarrier | ICustomer>();
  const usdot = form.watch('usdot');
  const withoutUsdot = form.watch('withoutUsdot');
  const isSubCustomer = form.watch('isSubCustomer');
  const isSubVendor = form.watch('isSubVendor');

  // Fetch parent customers for sub-customer selection
  const { data: parentCustomersData } = useQuery({
    queryKey: ['customers', { limit: 1000, page: 1, search: "" }],
    queryFn: () => apiService.getCustomers({ limit: 1000, page: 1, search: "" }),
    enabled: showIsSubCustomer && !!isSubCustomer,
  });

  // Fetch parent vendors for sub-vendor selection
  const { data: parentVendorsData } = useQuery({
    queryKey: ['vendors', { limit: 1000, page: 1, search: "", isAll: "" }],
    queryFn: () => apiService.getVendors({ limit: 1000, page: 1, search: "", isAll: "" }),
    enabled: showIsSubVendor && !!isSubVendor,
  });

 

  return (
    <Grid container spacing={1.75}>
      {/* USDOT field - shown first when available and Without USDOT is false */}
      <UsDotField setLocalUsdot={setLocalUsdot} entity={entity}/>
      {/* Company Name, Email, and Phone with dynamic column sizing based on USDOT visibility */}
      {(() => {
        const showUsdotField = showUSDOT && !withoutUsdot;
        const getColumnSize = () => showUsdotField ? 4 : 4; // Always 4 since we have 3 fields

        return (
          <>
           {/* M C Number */}
      
              <McNUmberFiled columnSize={getColumnSize()}/>
          
            {/* Company Name - always shown */}
            <Grid item xs={12} md={getColumnSize()}>
              <Controller
                name="company"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Company Name"
                    size="small"
                    error={!!form.formState.errors.company}
                    helperText={form.formState.errors.company?.message}
                  />
                )}
              />
            </Grid>

            {/* Nick Name - shown when enabled */}
            {showNickName && (
              <Grid item xs={12} md={getColumnSize()}>
                <Controller
                  name="nickName"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nick Name"
                      size="small"
                      error={!!(form.formState.errors as any).nickName}
                      helperText={(form.formState.errors as any).nickName?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Email - always shown */}
            <Grid item xs={12} md={getColumnSize()}>
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    size="small"
                    error={!!form.formState.errors.email}
                    helperText={form.formState.errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Phone - always shown */}
            <Grid item xs={12} md={getColumnSize()}>
              <Controller
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone"
                    size="small"
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    error={!!form.formState.errors.phone}
                    helperText={form.formState.errors.phone?.message}
                  />
                )}
              />
            </Grid>
          </>
        );
      })()}

      {/* Without USDOT toggle - placed in separate row for better spacing, hidden for carriers */}


      {/* Display Name - shown when enabled */}
      {showDisplayName && (
        <Grid item xs={12} md={4}>
          <Controller
            name="displayCustomerName"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={entity === 'vendor' ? "Display Vendor Name" : "Display Customer Name"}
                size="small"
                error={!!form.formState.errors.displayCustomerName}
                helperText={form.formState.errors.displayCustomerName?.message}
              />
            )}
          />
        </Grid>
      )}
     
        <Grid item xs={12} md={4}>
          <Controller
            name="address"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Address"
                size="small"
                error={!!form.formState.errors.address}
                helperText={form.formState.errors.address?.message}
              />
            )}
          />
        </Grid>
    

      {/* Mobile No - shown when enabled */}
      {showMobileNo && (
        <Grid item xs={12} md={4}>
          <Controller
            name="mobileNo"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Mobile No"
                size="small"
                onChange={(e) => {
                  field.onChange(e);
                }}
                error={!!form.formState.errors.mobileNo}
                helperText={form.formState.errors.mobileNo?.message}
              />
            )}
          />
        </Grid>
      )}

      {/* Fax - shown when enabled */}
      {showFax && (
        <Grid item xs={12} md={4}>
          <Controller
            name="fax"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Fax"
                size="small"
                error={!!form.formState.errors.fax}
                helperText={form.formState.errors.fax?.message}
              />
            )}
          />
        </Grid>
      )}

      {/* Other - shown when enabled */}
      {showOther && (
        <Grid item xs={12} md={4}>
          <Controller
            name="other"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Other"
                size="small"
                error={!!form.formState.errors.other}
                helperText={form.formState.errors.other?.message}
              />
            )}
          />
        </Grid>
      )}

      {/* Website - shown when enabled */}
      {showWebsite && (
        <Grid item xs={12} md={4}>
          <Controller
            name="website"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Website"
                size="small"
                error={!!form.formState.errors.website}
                helperText={form.formState.errors.website?.message}
              />
            )}
          />
        </Grid>
      )}

      {/* Name To Print On Check - shown when enabled */}
      {showNameToPrintOnCheck && (
        <Grid item xs={12} md={4}>
          <Controller
            name="nameToPrintOnCheck"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Name To Print On Check"
                size="small"
                error={!!(form.formState.errors as any).nameToPrintOnCheck}
                helperText={(form.formState.errors as any).nameToPrintOnCheck?.message}
              />
            )}
          />
        </Grid>
      )}

      {/* Is Sub Customer - shown when enabled */}
      {showIsSubCustomer  && (
        <>
          <Grid item xs={12} md={12} >
            <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '36px', justifyContent:'flex-start' }}>
              <Controller
                name="isSubCustomer"
                control={form.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox size='small'
                        {...field}
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                        sx={{
                          padding:'0px 5px 0px 15px',
                          '& .MuiSvgIcon-root': {
                            fontSize: 18
                          }
                        }}
                      />
                    }
                    label="Is Sub Customer"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: "14px",
                        fontWeight: 500,
                        color: '#101721'
                      }
                    }}
                  />
                )}
              />
            </Box>
          </Grid>

          {/* Parent Customer dropdown - shown when Is Sub Customer is checked */}
          {isSubCustomer && (
            <Grid item xs={12} md={12}>
              <Controller
                name="parentCustomer"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Parent Customer</InputLabel>
                    <Select
                      {...field}
                      label="Parent Customer"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {parentCustomersData?.data?.filter((customer: any) => customer._id !== id).map((customer: any) => (
                        <MenuItem key={customer._id} value={customer._id}>
                          {customer.company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}
        </>
      )}

      {/* Is Sub Vendor - shown when enabled */}
      {showIsSubVendor &&  (
        <>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
              <Controller
                name="isSubVendor"
                control={form.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox size='small'
                        {...field}
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        sx={{
                          padding:'0px 5px 0px 15px',
                          '& .MuiSvgIcon-root': {
                              fontSize: 18
                            }
                        }}
                      />
                    }
                    label="Is Sub Vendor"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: {xs:'14px', md:'14px'},
                        fontWeight: 500,
                        color: '#101721'
                      }
                    }}
                  />
                )}
              />
            </Box>
          </Grid>

          {/* Parent Vendor dropdown - shown when Is Sub Vendor is checked */}
          {isSubVendor && (
            <Grid item xs={12} md={12}>
              <Controller
                name="parentVendor"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Parent Vendor</InputLabel>
                    <Select
                      {...field}
                      label="Parent Vendor"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {parentVendorsData?.data?.filter((vendor: any) => vendor._id !== id).map((vendor: any) => (
                        <MenuItem key={vendor._id} value={vendor._id}>
                          {vendor.company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};
export default CompanySection;