import { CustomerStatus } from '@/types';
import { Chip, SxProps, Theme } from '@mui/material';
import { JSX } from 'react';

const getStatusBadge = (status: CustomerStatus, sx?: SxProps<Theme>): JSX.Element => {
  const statusColors: Record<CustomerStatus, string> = {
    active: 'success',
    inactive: 'error',
    suspended: 'warning',
  };
  return (
    <Chip
      label={status.toLowerCase()}
      color={statusColors[status] as 'success' | 'warning' | 'error'}
      sx={{ fontSize: '0.7rem', height: 'auto', px: 0, ...(sx as object) }}
    />
  );
};

export default getStatusBadge;
