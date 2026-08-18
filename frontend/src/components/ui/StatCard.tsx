import React from 'react';
import { Box, Card, CardContent, Typography, alpha } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: { value: number; label?: string };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color = '#00C48C', trend }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 140,
        borderRadius: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: '15px 15px !important' }}>
        <Box display="flex" alignItems="center" mb={0} gap={2}>
          <Box>
            {icon && (
            <Box
              sx={{
                width: {xs:38, md:42},
                height: {xs:38, md:42},
                borderRadius: 4,
                bgcolor: alpha(color, 1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:'#fff',
                flexShrink: 0,
                '& svg': { fontSize:{xs:20, md:24} },
              }}
            >
            {icon}
            </Box>
          )}
          </Box>

          <Box>
            <Typography fontSize={14} color="text.secondary" fontWeight={600} mb={0.5}>
            {label}
            </Typography>
            <Typography fontSize={17} fontWeight={700} lineHeight={1.2} color="text.primary">
            {value}
            </Typography>
          </Box>

        </Box>

        {subValue && (
          <Typography variant="body2" color="text.secondary" mt={0.4}>
            {subValue}
          </Typography>
        )}
        {trend !== undefined && (
          <Box display="flex" alignItems="center" mt={0.75} gap={0.5}>
              <Box
                sx={{
                  height: 4,
                  borderRadius: 2,
                  flex: 1,
                  bgcolor: 'action.hover',
                  overflow: 'hidden',
                }}
              >
              <Box
                sx={{
                  width: `${Math.min(Math.abs(trend.value), 100)}%`,
                  height: '100%',
                  bgcolor: color,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
              </Box>
            {trend.label && (
              <Typography variant="caption" color="text.secondary">
                {trend.label}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
