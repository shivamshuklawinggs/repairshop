import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
 Link as MuiLink,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { paths } from '@/utils/paths';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      if(formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      await apiService.resetPassword(token as string, formData.password);
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process request';
      setError(errorMessage);
      // toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `url(/banners/freight-login-bg.jpg) no-repeat center center`,
        backgroundSize: 'cover',
        position: 'relative',
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={
            { hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: "easeOut" }
              }}
          }
          style={{ width: '100%' }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography fontWeight={800} sx={{ mb: 0.5, textAlign:'center', fontSize:{ xs: '1.1rem', md: '1.2rem' }, color: '#222' }}>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your new password below
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField size='medium'
                fullWidth
                type={showPassword.password ? 'text' : 'password'}
                label="New Password"
                name="password"
                variant="outlined"
                //margin="normal"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                InputProps={{
                  sx: { borderRadius: 1 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('password')}
                        edge="end"
                      >
                        {showPassword.password ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField size='medium'
                fullWidth
                type={showPassword.confirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                name="confirmPassword"
                variant="outlined"
                margin="normal"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                InputProps={{
                  sx: { borderRadius: 1},
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        edge="end"
                      >
                        {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </form>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <MuiLink
                    component={Link}
                    to={paths.login}
                    color="#dd5d2c"
                    underline="hover"
                  >
                    Back to Login
                  </MuiLink>
                </Typography>
              </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResetPassword;
