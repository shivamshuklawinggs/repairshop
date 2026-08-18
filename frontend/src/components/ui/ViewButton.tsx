import React from "react";
import { Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface ViewButtonProps {
  count?: number;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const ViewButton: React.FC<ViewButtonProps> = ({ count = 0, onClick }) => {
  return (
    <Button
      color="primary"
      startIcon={<VisibilityIcon/>}
      onClick={(e) => {
        onClick?.(e);
      }}
      sx={{
        p: 0,
        minHeight: 'auto',
        minWidth: "auto",
        textTransform: "none",
        fontSize: "13px",
        fontWeight: 500,
        color:'#101721',
        '& .MuiButton-startIcon': {
          marginRight: '4px'
        },
        '& .MuiButton-startIcon svg': {
          fontSize: '13px',
          color:'#101721',
        },
        "&:hover": {
          backgroundColor: "transparent",
          textDecoration: "underline",
        },
      }}
    >
      View {count ? `(${count})` : ""}
    </Button>
  );
};

export default ViewButton;