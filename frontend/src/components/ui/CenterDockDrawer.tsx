import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Typography,
  IconButton,Fab
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ColumnDef } from "./DataTable";
interface ColumnSelectorProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    columns: ColumnDef[];
    visibleColumns: string[];
    defaultColumns: string[];
    onChange: (columns: string[]) => void;
    width?: number;
}
const CenterDockDrawer:React.FC<ColumnSelectorProps>  = ({
  open,
  onClose,
  title = "Visible Columns",
  columns,
  visibleColumns,
  defaultColumns,
  onChange,
}) => {
  const enabledColumns = columns.filter((c: any) => !c.disabled);

  const selectedCount = enabledColumns.filter((c: any) =>
    visibleColumns.includes(c.key)
  ).length;

  const isAllSelected = selectedCount === enabledColumns.length;

  const handleToggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      onChange(visibleColumns.filter((x: string) => x !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange(columns.filter((c: any) => c.disabled).map((c: any) => c.key));
    } else {
      onChange(columns.map((c: any) => c.key));
    }
  };

  const handleReset = () => {
    onChange(defaultColumns);
  };

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
        maxWidth: 400,
        width:'95%',
        height:'60vh',
        margin:{xs:'15% auto', md:'10% auto'},
        borderRadius: 1,
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {/* Handle */}
      {/* <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pt: 1,
        }}
      >
        <Box
          sx={{
            width: 50,
            height: 5,
            borderRadius: 10,
            bgcolor: "grey.400",
          }}
        />
      </Box> */}

      {/* Header */}
      <Box
        sx={{
          px: {xs:2, md:3},
          py: {xs:1, md:1.5},
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography fontSize={{xs:15, md:16}} fontWeight={700}>
            {title}
          </Typography>

          <Typography fontSize={13} color="text.secondary">
            {selectedCount} of {enabledColumns.length} selected
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" sx={{color:'#555'}}/>
        </IconButton>
      </Box>

      <Divider />

      {/* Select All */}
      <Box
        onClick={handleSelectAll}
        sx={{
          px: 2,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          bgcolor: "grey.50",
        }}
      >
        <Checkbox
          checked={isAllSelected}
          indeterminate={selectedCount > 0 && !isAllSelected}
          sx={{
            padding:'6px',
            '& .MuiSvgIcon-root': {
              fontSize: {xs:17, md:18}
            }
          }}
        />

        <Typography fontSize={{xs:13, md:14}} fontWeight={600}>
          Select All Columns
        </Typography>
      </Box>

      <Divider />

      {/* Columns */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py:1.5
        }}
      >
        {enabledColumns.map((col: any) => (
          <Box
            key={col.key}
            onClick={() => handleToggle(col.key)}
            sx={{
              px: 2,
              py: 0,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <Checkbox checked={visibleColumns.includes(col.key)}
            sx={{
              padding:'6px',
            '& .MuiSvgIcon-root': {
              fontSize: {xs:17, md:18}
            }
          }}
            />

            <Typography fontSize={{xs:13.6, md:14.6}}>
              {col.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py:1.5,
          display: "flex",
          gap: 1,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={handleReset}
        >
          Reset
        </Button>

        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
        >
          Apply
        </Button>
      </Box>
    </Drawer>
  );
};

export default CenterDockDrawer;