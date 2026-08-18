import { useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Box, Button, TextField, Typography, Checkbox, FormControlLabel, IconButton, InputAdornment, Alert, Paper, alpha, capitalize } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { defaultLoginValues, loginSchema } from '@/pages/auth-service/Schema/loginSchema';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginFailure, loginStart, loginSuccess } from '@/redux/Slice/UserSlice';
import apiService from '@/service/apiService';
import { paths } from '@/utils/paths';
import { getDefaultPathForRole, isPathAllowedForRole } from '@/utils/roleHelpers';
import { protectedRoutes } from '@/routes';
import { Link } from 'react-router-dom';
import { RootState } from '@/redux/store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { initialCompanyData } from '@/redux/InitialData/initialCompanyData';
import { IUser, Role } from '@/types';
export interface IApiResponse {
  success: boolean;
  data: {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}
const Login = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: any) => apiService.login(data),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (response:IApiResponse) => {
      console.log('Login response:', response);

      // Store the token if it exists in the response
      const token = response.data.accessToken

      dispatch(loginSuccess({
        user: response.data.user as any,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        currentCompanyDetails: initialCompanyData,
        token,
      }));
      const userRole = response.data.user.role as Role;
      const defaultPath = getDefaultPathForRole(userRole);
      navigate(defaultPath);
      queryClient.invalidateQueries({
        queryKey: ['fetchUser'],
      });
    },
    onError: (error: any) => {
      dispatch(loginFailure(error.message));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: defaultLoginValues,
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        backgroundImage: `url('/banners/freight-login-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      {/* Left side overlay */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '42%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 600 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="FreightBooks"
            sx={{ mb: 2, width:'263px' }}
            onError={(e: any) => { e.target.style.display = 'none'; }}
          />
          <Typography
            variant="h3"
            sx={{
              color: '#111',
              fontWeight: 800,
              textTransform: 'capitalize',
              fontSize: { md: '2rem', lg: '2.6rem' },
              lineHeight: 1.25,
              mb: 1.5,
            }}
          >
            Smart Solutions for<br /> Modern Freight
          </Typography>
          <Typography variant="body1" sx={{ color: '#151515', lineHeight: 1.5, fontSize: '1.2rem' }}>
            Streamline your freight operations <br /> with our comprehensive management platform.
          </Typography>
        </Box>
      </Box>

      {/* Right side — login form */}
      <Box
        sx={{
          display: 'flex',
          //width: '42%',
          width: { xs: '100%', md: '42%' },
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: { xs: 3, sm: 4 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0,
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>F</Typography>
            </Box>
          </Box>

          <Typography fontWeight={800} sx={{ mb: { xs: 0.1, md: 0.3 }, textAlign:'center', fontSize:{ xs: '1.1rem', md: '1.2rem' }, color: '#222' }}>
            Welcome to Freight Books
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center' }}>
            Enter your credentials to access your account
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField size='medium'
              fullWidth
              label="Email Address"
              placeholder="you@company.com"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2}}
            />
            <TextField size='medium'
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}

              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {loginMutation.error && (
              <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 1.5 }}>
                {loginMutation.error?.message || 'Login failed. Please try again.'}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">Remember me</Typography>
                }
                sx={{ m: 0 }}
              />
              <Link
                to={paths.forgetpassword}
                style={{
                  color: '#dd5d2c',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loginMutation.isPending}
              size="large"
              sx={{ py: 1.25, mb: 3, borderRadius: 1, backgroundColor: '#dd5d2c', fontSize: '1.1rem' }}
            >
              {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              {['Terms', 'Privacy', 'Support'].map((item) => (
                <Link
                  key={item}
                  to="#"
                  style={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;