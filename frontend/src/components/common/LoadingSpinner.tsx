import React from "react";
import { Box, CircularProgress, Typography, SxProps } from "@mui/material";
import { Theme } from "@mui/system";

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  sx?: SxProps<Theme>;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 36,
  label,
  sx = { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 1.5 },
}) => {
  return (
    <Box sx={sx}>
      <CircularProgress size={size} thickness={3.5} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
