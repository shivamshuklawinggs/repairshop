import React from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
  label: string;
  color?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const StatusChip: React.FC<StatusChipProps> = ({
  label,
  color = '#00C48C',
  size = 'small',
  variant = 'filled',
}) => {
  if (variant === 'outlined') {
    return (
      <Chip
        label={label}
        size={size}
        variant="outlined"
        sx={{
          borderColor: color,
          color,
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 22,
        }}
      />
    );
  }

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: color,
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
};

export default StatusChip;
