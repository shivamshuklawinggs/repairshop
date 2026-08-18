import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  Chip,
  Stack,
  IconButton,
  Switch
} from '@mui/material';

interface DetailItem {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

interface ActionItem {
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'error' | 'default';
  size?: 'small' | 'medium';
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  showChip?: boolean;
  onClick?: () => void;
  sx?: object;
  description?: string;
  details?: DetailItem[];
  actions?: ActionItem[];
  showToggle?: boolean;
  toggleState?: boolean;
  onToggleChange?: (checked: boolean) => void;
  toggleLabel?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  color = '#6b7280',
  icon,
  showChip = true,
  onClick,
  sx = {},
  description,
  details = [],
  actions = [],
  showToggle = false,
  toggleState = false,
  onToggleChange,
  toggleLabel,
}) => {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        borderRadius: 1,
        border: 'none',
       // bgcolor: alpha(color, 0.15),
        background: `linear-gradient(
           135deg,
           ${alpha(color, 0.15)} 0%,
           ${alpha(color, 0.12)} 50%,
           ${alpha(color, 0.10)} 100%
         )`,
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          //borderColor: alpha(color, 0.8),
          // boxShadow: `0 4px 16px ${alpha(color, 0.15)}`,
          //transform: 'translateY(-2px)',
        } : {},
        ...sx,
      }}
    >
      <CardContent sx={{ p: '10px 13px 10px 13px !important'}}>
        <Typography
        fontWeight={600}
        sx={{ fontSize: '13px', color: 'text.primary', textTransform: 'capitalize', mb:0.5}}>
        {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems:'center', justifyContent: 'space-between'}}>
          <Box>
          {showChip && (
            <Chip
              label={value}
              size="small"
              sx={{
                height: 'auto',
                fontWeight: 600,
                borderRadius: 0.5,
                bgcolor: 'transparent',
                color:'text.primary',
                '& .MuiChip-label': { px: 0.5, fontSize: '21px'},
              }}
            />
          )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 4,
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                //boxShadow:'4px 3px 10px 0px rgb(0 0 0 / 20%)',
              }}
            >
            {icon}
            </Box>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontSize: '0.75rem', lineHeight: 1.2 }}
            noWrap
            title={description}
          >
            {description}
          </Typography>
        )}

        {/* Details */}
        {details.length > 0 && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {details.map((detail, index) => (
              <Stack key={index} direction="row" spacing={0.5} alignItems="center">
                {detail.icon && (
                  <Box sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    {detail.icon}
                  </Box>
                )}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                  {detail.label}: {detail.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Actions and Toggle */}
        {(actions.length > 0 || showToggle) && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1.5 }}
          >
            {showToggle && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {toggleLabel || (toggleState ? 'Active' : 'Inactive')}
                </Typography>
                <Switch
                  checked={toggleState}
                  onChange={(_, checked) => onToggleChange?.(checked)}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase': { color: 'rgba(255,255,255,0.8)' } }}
                />
              </Stack>
            )}

            {actions.length > 0 && (
              <Stack direction="row" spacing={0.5}>
                {actions.map((action, index) => (
                  <IconButton
                    key={index}
                    color={action.color || 'default'}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    size={action.size || 'small'}
                    sx={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {action.icon}
                  </IconButton>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
