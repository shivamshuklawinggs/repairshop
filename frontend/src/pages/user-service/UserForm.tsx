import React, { useEffect, useState } from 'react';
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import apiService from '@/service/apiService';
import {
  Dialog, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Box, FormHelperText,
  InputAdornment,
  IconButton,
  OutlinedInput, Chip, Typography, Card, CardContent, useTheme, alpha, CircularProgress, Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock, AdminPanelSettings, Business } from '@mui/icons-material';
import getAssignableRoles from '@/utils/getAvailableRoles';
import { Userschema, defaulUsertValues } from './Schema/userSchema';
import { ICompany, IUser, Role, VisibleCompanyAssignedRoles } from '@/types';
import { toast } from 'react-toastify';
import { paths } from '@/utils/paths';
import { AppDispatch, RootState } from '@/redux/store';
import FormSelect, { SelectOption } from '@/components/ui/FormSelect';
import { useDispatch, useSelector } from 'react-redux';
import { isRole } from '@/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchAllCompanies } from '@/redux/api';
import MenuPermissionsTable from './MenuPermissionsTable';
import { getIcon } from '@/components/common/icons/getIcon';
import { NumericInput } from '@/components/ui';
import AppDialog from '@/components/ui/AppDialog';

type CompanyQueryKey = ['companies', string | undefined];


interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user?: IUser | null
}

const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  onSubmit,
  user
}) => {
  const theme = useTheme();
  const qc = useQueryClient()
  const { user: currentUser } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState({
    password: false,
    repeatPassword: false
  });

  const methods = useForm<IUser>({
    mode: "onSubmit",         // validate on submit
    reValidateMode: "onChange", // optional
    shouldFocusError: true,    // <--- automatically focus first field with error
    resolver: yupResolver(Userschema) as Resolver<IUser>,
    defaultValues: defaulUsertValues
  });
  const { register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control } = methods
  const mutation = useMutation({
    mutationFn: (data: IUser) => {
      if (user?._id) {
        return apiService.updateUser(user._id, data);
      }
      return apiService.createUser(data);
    },
    onSuccess: () => {
      toast.info(user?._id ? 'User updated successfully' : 'User created successfully');
      qc.invalidateQueries({ queryKey: ['users'] });
      onSubmit();
      reset();
      navigate(paths.users);
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    },
  });

  const { data: users = [] } = useQuery<IUser[]>({
    queryKey: ['users', Role.MANAGER],
    queryFn: async () => {
      const response = await apiService.getUsers({ page: 1, limit: 100, role: Role.MANAGER });
      return response.data;
    }
  });


  const togglePasswordVisibility = (field: 'password' | 'repeatPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const availableRoles = getAssignableRoles();

  const onSubmitForm = async (data: IUser) => {
    if (isRole.isSuperAdmin(currentUser?.role || '')) {
      data.role = Role.ADMIN
    }
    mutation.mutate(data);
  };

  useEffect(() => {
    if (open) {
      const initialValues = user ? { ...defaulUsertValues, ...user, isUpdate: true } : { ...defaulUsertValues, isUpdate: false };
      reset(initialValues);
    }
  }, [user, open, reset]);

  useEffect(() => {
    
    if (currentUser?.role === Role.SUPERADMIN) {
      setValue("role", Role.ADMIN)
    }
    if (currentUser?.role === Role.MANAGER) {
      setValue("manager",currentUser._id)
    }
  }, [watch('role')]);

  // Fetch companies using React Query
  const { data: companies = [] } = useQuery<ICompany[], Error, ICompany[], CompanyQueryKey>({
    queryKey: ['companies', user?._id],
    queryFn: async () => {
      const response = await dispatch(fetchAllCompanies({ check: true })).unwrap();
      return response;
    },
    enabled: !!currentUser && currentUser.role !== Role.SUPERADMIN,
  });

  const handleClose = () => {
    reset();
    onClose();
  };
  return (
    <AppDialog
      open={open}
      onClose={handleClose}
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
        pl: 3.5,
        pr: 2,
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
            <Person sx={{ fontSize: 16 }} />
          </Box> */}
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {user?._id ? 'Edit User' : 'Add New User'}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
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

      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmitForm)} noValidate>
          <DialogContent sx={{ px:{xs:2, md:3}, py:{xs:2, md:3}, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 0,
                    borderRadius: 0,
                    border: 'none',
                  }}
                >
                  <CardContent style={{ padding: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Person sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Basic Information
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField size='small'
                          label="Name"
                          fullWidth
                          required
                          placeholder="Enter user name"
                          {...register('name')}
                          error={!!errors.name}
                          helperText={errors.name?.message}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField size='small'
                          label="Email"
                          type="email"
                          fullWidth
                          required
                          placeholder="Enter email address"
                          {...register('email')}
                          error={!!errors.email}
                          helperText={errors.email?.message}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <TextField size='small'
                              {...field}
                              fullWidth
                              label="Phone"
                              placeholder="Enter phone number"
                              onChange={(e) =>  field.onChange(e)}
                              error={!!errors.phone}
                              helperText={errors.phone?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="extentionNo"
                          control={control}
                          render={({ field }) => (
                            <TextField size='small'
                              {...field}
                              fullWidth
                              label="Extension No"
                              placeholder="Enter extension number"
                              error={!!errors.extentionNo}
                              helperText={errors.extentionNo?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Section */}
              <Grid item xs={12}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 0,
                    borderRadius: 0,
                    border: 'none',
                  }}
                >
                  <CardContent style={{ padding: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Lock sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Security
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField size='small'
                          label="Password"
                          type={showPassword.password ? 'text' : 'password'}
                          fullWidth
                          autoComplete="new-password"
                          required={!user?._id}
                          placeholder={user?._id ? "Leave blank to keep current password" : "Enter password"}
                          {...register('password')}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => togglePasswordVisibility('password')}
                                  edge="end"
                                  sx={{ color: 'action.active' }}
                                >
                                  {showPassword.password ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                          error={!!errors.password}
                          helperText={errors.password?.message || (user?._id ? "Leave blank to keep current password" : "")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField size='small'
                          label="Repeat Password"
                          type={showPassword.repeatPassword ? 'text' : 'password'}
                          fullWidth
                          placeholder={user?._id ? "Leave blank to keep current password" : "Confirm password"}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => togglePasswordVisibility('repeatPassword')}
                                  edge="end"
                                  sx={{ color: 'action.active' }}
                                >
                                  {showPassword.repeatPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                          required={!user?._id}
                          {...register('repeatPassword')}
                          error={!!errors.repeatPassword}
                          helperText={errors.repeatPassword?.message || (user?._id ? "Leave blank to keep current password" : "")}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Role & Permissions Section */}
              <Grid item xs={12}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 0,
                    borderRadius: 0,
                    border: 'none',
                  }}
                >
                  <CardContent style={{ padding: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AdminPanelSettings sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Role & Permissions
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={12}>
                        <FormControl size='small' fullWidth error={!!errors.role}>
                          <InputLabel>Role <span style={{color:'#c62828'}}>*</span></InputLabel>
                          <Select
                            label="Role *"
                            required
                            defaultValue={user?.role || ''}
                            {...register('role')}
                            style={{ textTransform: "capitalize" }}
                          >
                            {availableRoles.map((role) => (
                              <MenuItem
                                key={role}
                                value={role}
                                style={{ textTransform: "capitalize" }}
                              >
                                {role}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                        </FormControl>
                      </Grid>
                        <Grid item xs={12} md={12}>
                          <FormControl size='small' fullWidth error={!!errors.manager}>
                            <InputLabel>Manager <span style={{color:'#c62828'}}>*</span></InputLabel>
                            <Select
                              label="Manager *"
                              required
                              {...register('manager')}
                              value={watch('manager')}
                              style={{ textTransform: "capitalize" }}
                            >
                              {users.map((user) => (
                                <MenuItem
                                  key={user._id}
                                  value={user._id}
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {user.name}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.manager && <FormHelperText>{errors.manager.message}</FormHelperText>}
                          </FormControl>
                        </Grid>
                      {/* Visible Companies */}
                      {(VisibleCompanyAssignedRoles.includes(watch('role') as Role) && companies?.length > 0) && (
                        <Grid item xs={12}>
                          <FormSelect
                            label="Visible Companies"
                            isMulti={true}
                            options={companies?.filter((c) => c._id).map((company) => ({
                              value: company._id!,
                              label: company.label,
                            })) || []}

                            styles={{
                              control: (base) => ({
                                ...base,
                                fontSize: '13.6px',
                                borderColor:'#101721',
                                boxShadow:'none',
                                ':hover': {
                                  borderColor:'#101721',
                                },
                              }),
                              menu: (base) => ({
                                ...base,
                                fontSize: '13.6px',
                              }),
                              option: (base) => ({
                                ...base,
                                fontSize: '13px',
                                padding:'6px 12px',
                                background:'#fff',
                                borderBottom:'1px solid #ddd',
                                '&:last-child': {
                                  borderBottom:'none',
                                },
                                ':active': {
                                  backgroundColor:'#e9e9e9',
                                },
                              }),
                              placeholder: (base) => ({
                                ...base,
                                fontSize: '13.6px',
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: '#e9e9e9', // Change chip background
                                borderRadius: '5px',
                                padding:'0px 5px',
                                margin:'3px',
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                fontSize: '13px',
                                color:'#000',
                                fontWeight:'500',
                                padding:'2px 0px',
                              }),
                              // Close (×) icon
                              multiValueRemove: (base) => ({
                                ...base,
                                color: '#ef4444', // Icon color
                                borderRadius: '0 4px 4px 0',
                                ':hover': {
                                  backgroundColor: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                },
                              }),
                            }}

                            value={companies?.filter((c) => c._id && (watch('visibleCompany') || []).includes(c._id)).map((c) => ({
                              value: c._id!,
                              label: c.label,
                            })) || []}
                            onChange={(selectedOptions) => {
                              if (selectedOptions && Array.isArray(selectedOptions)) {
                                setValue('visibleCompany', (selectedOptions as SelectOption[]).map((opt) => opt.value), {
                                  shouldValidate: true,
                                });
                              }
                            }}
                            error={errors.visibleCompany?.message}
                            required
                          />
                        </Grid>
                      )}

                      {/* No Companies Available */}
                      {(VisibleCompanyAssignedRoles.includes(watch('role') as Role) && companies?.length === 0) && (
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
                            <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
                              No companies available. Please Create One First.
                            </Typography>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => { navigate(paths.viewcompany); handleClose(); }}
                              startIcon={<Business />}
                            >
                              Create Company
                            </Button>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Menu Permissions Section */}
              {[Role.MANAGER ,Role.ACCOUNTANT].includes(watch('role') as Role) && (
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 0,
                      borderRadius: 0,
                      border: 'none',
                    }}
                  >
                    <CardContent style={{ padding: 0 }}>
                      {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                         <AdminPanelSettings sx={{ fontSize: 16, color: 'primary.main' }} />
                         <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Menu Permissions
                        </Typography>
                      </Box> */}
                      <MenuPermissionsTable />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          {/* Actions */}
          <DialogActions sx={{ gap: 0.8, px: 3, py: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Button
              onClick={handleClose}
              disabled={mutation.isPending}
              variant="outlined"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={17} color="inherit" /> : null}
            >
              {mutation.isPending ? 'Saving...' : user?._id ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </AppDialog>
  );
};


export default UserForm;