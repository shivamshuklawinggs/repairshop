import React from 'react';
import { Box, Typography } from '@mui/material';

interface LabelValueProps {
  label: string;
  value: string | number | React.ReactNode;
  direction?: 'column' | 'row';
}

const LabelValue: React.FC<LabelValueProps> = ({ label, value, direction = 'column' }) => {
  if (direction === 'row') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" noWrap>
          {label}:
        </Typography>
        <Typography variant="body2" color="text.primary">
          {value}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" mt={0.25}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
};

export default LabelValue;
