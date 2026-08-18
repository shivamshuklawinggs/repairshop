import React from 'react';
import { Box, Paper, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  color?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  elevation?: number;
  noPadding?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  color,
  action,
  children,
  elevation = 0,
  noPadding = false,
}) => {
  const theme = useTheme();
  const accentColor = color ?? theme.palette.primary.main;

  return (
    <Paper
      variant="outlined"
      elevation={elevation}
      sx={{ borderRadius: 0.5, overflow: 'hidden' }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(accentColor, 0.05),
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {icon && (
            <Box
              sx={{
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                '& svg': { fontSize: 16 },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            {title}
          </Typography>
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      <Box sx={noPadding ? undefined : { px: 2, py:1.5}}>{children}</Box>
    </Paper>
  );
};

export default SectionCard;
