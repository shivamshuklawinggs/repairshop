import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Chip, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LockOutlined as LockIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { paths } from '@/utils/paths';
import { Role } from '@/types';
import { useAppSelector } from '@/redux/store';

const NotAuthorized: FC = () => {
  const role = useAppSelector((state) => state.user?.user?.role);
  const theme = useTheme();

  return (
    <Box
      sx={{
        //minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: 'error.main' }} />
        </Box>

        <Typography
          sx={{
            fontSize: { xs: '4rem', sm: '6rem' },
            fontWeight: 900,
            lineHeight: 1,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          403
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
          Sorry, you don't have permission to access this page.
        </Typography>

        {/* {role && (
          <Chip
            label={`Current Role: ${role}`}
            variant="outlined"
            size="small"
            sx={{ mb: 3, textTransform: 'capitalize' }}
          />
        )} */}

        <Box>
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
    </Box>
  );
};

export default NotAuthorized;