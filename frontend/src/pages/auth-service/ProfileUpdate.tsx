import React, { useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Grid,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axiosInterceptor';
import { paths } from '@/utils/paths';
import { RootState, useAppDispatch } from '@/redux/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { Person, Email, Phone, VisibilityOff, Visibility } from '@mui/icons-material';
import apiService from '@/service/apiService';
import { fetchCurrentUser } from '@/redux/api';
import PlanDetails from './PlanDetails';
import { Role } from '@/types';

// Profile update schema - matches backend validation
const profileUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Invalid email format')
    .max(100, 'Email must be at most 100 characters')
    .required('Email is required'),
  phone: yup.string()
    .min(10, 'Phone must be at least 10 characters')
    .max(10, 'Phone must be at most 10 characters')
    .optional(),
  password: yup.string().optional(),
  repeatPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .when('password', {
      is: (password: string) => password && password.length > 0,
      then: (schema) => schema.required('Please confirm your password'),
      otherwise: (schema) => schema.optional(),
    }),
});

type ProfileFormData = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  repeatPassword?: string;
};

const ProfileUpdate: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({
    password: false,
    repeatPassword: false
  });
  const { user } = useSelector((state: RootState) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileUpdateSchema),
    defaultValues: {
      name:'',
      email: '',
      phone:  '',
    },
  });

  // Fetch current user data
  const { isLoading,data,error,refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiService.getCurrentUser();
      reset({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
      return response?.data
    },
    enabled: !!user,
  });

  // Check if user is admin and has plan details
  const isAdmin = user?.role === Role.ADMIN
  const planDetails = data?.planDetails;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.put('/auth/update-profile', data),
    onSuccess: async () => {
      refetch()
      await dispatch(fetchCurrentUser()).unwrap();
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    // Only send password if it's provided, exclude repeatPassword
    const { repeatPassword, ...submitData } = data;
    const finalData = data.password ? submitData : { name: data.name, email: data.email, phone: data.phone };
    updateProfileMutation.mutate(finalData);
  };

  const togglePasswordVisibility = (field: 'password' | 'repeatPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400 }}>
      <Grid container spacing={3}>
        {/* Left side - Profile Update Form */}
        <Grid item xs={12} md={isAdmin && planDetails ? 6 : 12}>
          <Paper
        elevation={0}
        sx={{
          p:{xs:2, md:3},
          borderRadius: 1,
          bgcolor: 'background.paper',
          border:'1px solid #e2e8f0'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography fontWeight={600} fontSize={{xs:16, md:17}} component="h1">
            Update Profile
          </Typography>
          <Typography fontSize={{xs:13, md:14}} color="text.secondary" sx={{ mt: 0.2 }}>
            Update your personal information
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load profile data. Please try again.
          </Alert>
        )}

        {updateProfileMutation.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {updateProfileMutation.error?.message || 'Failed to update profile. Please try again.'}
          </Alert>
        )}

        {updateProfileMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={updateProfileMutation.isPending}
                InputProps={{
                  startAdornment: <Person style={{ marginRight: 5, color: '#575757' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={updateProfileMutation.isPending}
                InputProps={{
                  startAdornment: <Email style={{ marginRight: 5, color: '#575757' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                disabled={updateProfileMutation.isPending}
                InputProps={{
                  startAdornment: <Phone style={{ marginRight: 5, color: '#575757' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password (Optional)"
                type={showPassword.password ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
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
                helperText={errors.password?.message}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword.repeatPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm new password"
                {...register('repeatPassword')}
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
                error={!!errors.repeatPassword}
                helperText={errors.repeatPassword?.message}
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt:3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(paths.dashboard)}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateProfileMutation.isPending}
              startIcon={updateProfileMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </Box>
        </Box>
      </Paper>
        </Grid>

        {/* Right side - Plan Details (only for admin users) */}
        {isAdmin && planDetails && (
          <Grid item xs={12} md={6}>
            <PlanDetails planDetails={planDetails} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProfileUpdate;
