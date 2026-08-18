import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      flexWrap="wrap"
      gap={1}
    >
      <Box>
        {title && (
          <Typography fontWeight={600} fontSize={{xs:16, md:17}}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography fontSize={{xs:13, md:14}} color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          {actions}
        </Stack>
      )}
    </Box>
  );
};

export default PageHeader;
