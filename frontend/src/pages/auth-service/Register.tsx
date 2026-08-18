import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Avatar, 
  Grid, 
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import apiService from '@/service/apiService';
import { paths } from '@/utils/paths';
import { RootState } from '@/redux/store';
import { useMutation } from '@tanstack/react-query';
import * as yup from 'yup';
import { Person, Email, Lock, Phone, Business } from '@mui/icons-material';
import { IUser } from '@/types';

// Register schema
const registerSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  repeatPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
  phone: yup.string().optional(),
});

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  repeatPassword: string;
  phone?: string;
};

const Register: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      repeatPassword: '',
      phone: '',
    },
  });

  const password = watch('password');

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, 'repeatPassword'>) => apiService.register(data as any),
    onSuccess: (response) => {
      // Redirect to login after successful registration
      navigate(paths.login);
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const { repeatPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: theme.palette.primary.main,
            }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign up to get started with FreightBooks
          </Typography>
        </Box>

        {registerMutation.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {registerMutation.error?.message || 'Registration failed. Please try again.'}
          </Alert>
        )}

        {registerMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Registration successful! Redirecting to login...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={registerMutation.isPending}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={registerMutation.isPending}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={registerMutation.isPending}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                {...register('repeatPassword')}
                error={!!errors.repeatPassword}
                helperText={errors.repeatPassword?.message}
                disabled={registerMutation.isPending}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone (Optional)"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                disabled={registerMutation.isPending}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to={paths.login}>
                Sign in
              </Link>
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={registerMutation.isPending}
              startIcon={registerMutation.isPending ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 120 }}
            >
              {registerMutation.isPending ? 'Creating...' : 'Register'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
