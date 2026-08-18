import { Link, Navigate } from 'react-router-dom';
import { Box, Typography, Button, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { SearchOff as SearchOffIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { paths } from '@/utils/paths';
import { Role } from '@/types';
import { useAppSelector } from '@/redux/store';

const NotFound = () => {
  const role = useAppSelector((state) => state.user?.user?.role);
  const theme = useTheme();
  const user = useAppSelector((state) => state.user);
  if(!user.isAuthenticated){
    return <Navigate to={`${paths.login}?next=${window.location.pathname}`} replace />;
  }
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 480,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <SearchOffIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </Box>

        {/* 404 number */}
        <Typography
          sx={{
            fontSize: { xs: '5rem', sm: '7rem' },
            fontWeight: 900,
            lineHeight: 1,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>

        <Button
          component={Link}
          to={role === Role.SUPERADMIN ? paths.superadminDashboard : !role ? paths.login : paths.dashboard}
          variant="contained"
          size="large"
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {!role ? 'Go to Login' : 'Back to Dashboard'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;