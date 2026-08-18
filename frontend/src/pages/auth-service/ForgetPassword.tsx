import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link as MuiLink,
  Alert,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import apiService from '@/service/apiService';
import { paths } from '@/utils/paths';

interface ForgetPasswordFormData {
  email: string;
}

const ForgetPassword: React.FC = () => {
  const [formData, setFormData] = useState<ForgetPasswordFormData>({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiService.forgetPassword(formData.email);
      toast.success('Password reset instructions have been sent to your email');
      setFormData({ email: '' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process request';
      setError(errorMessage);
      // toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ email: value });
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
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography fontWeight={800} sx={{ mb: 0.5, textAlign:'center', fontSize:{ xs: '1.1rem', md: '1.2rem' }, color: '#222' }}>
                Forgot your password?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We get it, stuff happens. Just enter your email address below and we'll send you a link to reset your password!
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
                label="Email Address"
                variant="outlined"
                margin="normal"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                InputProps={{
                  sx: { borderRadius: 1 }
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
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <MuiLink
                    component={Link}
                    to={paths.login}
                    color="#dd5d2c"
                    fontWeight="500"
                    underline="hover"
                  >
                    Back to Login
                  </MuiLink>
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <MuiLink href="#" color="text.secondary" underline="hover" variant="caption">
                    Terms
                  </MuiLink>
                  <MuiLink href="#" color="text.secondary" underline="hover" variant="caption">
                    Privacy
                  </MuiLink>
                  <MuiLink href="#" color="text.secondary" underline="hover" variant="caption">
                    Support
                  </MuiLink>
                </Box>
              </Box>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ForgetPassword;