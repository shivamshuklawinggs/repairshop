import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import { ColumnDef } from "./DataTable";
interface ColumnSelectorProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    title?: string;
    columns: ColumnDef[];
    visibleColumns: string[];
    defaultColumns: string[];
    onChange: (columns: string[]) => void;
    width?: number;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
    anchorEl,
    open,
    onClose,
    title = "Visible Columns",
    columns,
    visibleColumns,
    defaultColumns,
    onChange,
    width = 220,
}) => {
    const enabledColumns = columns.filter((c) => !c.disabled);

    const selectedCount = enabledColumns.filter((c) =>
        visibleColumns.includes(c.key)
    ).length;

    const isAllSelected = selectedCount === enabledColumns.length;

    const handleToggle = (key: string) => {
        if (visibleColumns.includes(key)) {
            onChange(visibleColumns.filter((x) => x !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            onChange(columns.filter((c) => c.disabled).map((c) => c.key));
        } else {
            onChange(columns.map((c) => c.key));
        }
    };

    const handleReset = () => {
        onChange(defaultColumns);
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            PaperProps={{
                sx: {
                    minWidth: 220,
                    borderRadius: 0.5,
                    overflow: "hidden",
                    boxShadow: "0 12px 30px rgba(0,0,0,.12)",
                    border: "1px solid #E5E7EB",
                    '& .MuiList-root': {
                        py: 0.4,
                    },
                },
            }}
        >
            {/* Header */}

            <Box
                sx={{
                    px: 2,
                    py: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #ddd",
                }}
            >
                <Typography
                    fontSize={12}
                    fontWeight={600}
                    letterSpacing={0.5}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase' }}
                >
                    {title}
                </Typography>

                <Typography fontSize={12} color="text.secondary">
                    {selectedCount} / {enabledColumns.length}
                </Typography>
            </Box>

            {/* Select All */}

            <MenuItem
                dense
                onClick={handleSelectAll}
                sx={{
                    py: 1,
                    borderBottom: "1px solid #ddd",
                    gap: 0.6,
                    "&:hover": {
                        bgcolor: "#ececec",
                    },
                }}
            >
                <Checkbox
                    size="small"
                    checked={isAllSelected}
                    indeterminate={selectedCount > 0 && !isAllSelected}
                    sx={{
                        p: 0,
                        "& .MuiSvgIcon-root": {
                            fontSize: { xs: 16, md: 17 },
                        },
                    }}
                />

                <Typography fontSize={{ xs: 13, md: 13 }} fontWeight={600}>
                    Select All
                </Typography>
            </MenuItem>

            {/* Column List */}

            <Box
                sx={{
                    maxHeight:{xs:150, md:280},
                    overflowY: "auto",
                    py: 1,

                    "&::-webkit-scrollbar": {
                        width: 4,
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "#C7CDD4",
                        borderRadius: 5,
                    },
                }}
            >
                {enabledColumns.map((col) => (
                    <MenuItem
                        key={col.key}
                        dense
                        onClick={() => handleToggle(col.key)}
                        sx={{
                            py: 0.5,
                            gap: 0.7,
                            transition: ".2s",
                            "&:hover": {
                                bgcolor: "#ececec",
                            },
                        }}
                    >
                        <Checkbox
                            size="small"
                            checked={visibleColumns.includes(col.key)}
                            sx={{
                                p: 0,
                                "& .MuiSvgIcon-root": {
                                    fontSize: { xs: 16, md: 17 },
                                },
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: { xs: 13, md: 14 },
                                flex: 1,
                            }}
                        >{col.label}</Typography>
                    </MenuItem>
                ))}
            </Box>

            <Divider />

            {/* Footer */}

            <Box
                sx={{
                    py: 1,
                    px: 1.5,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "space-between",
                }}
            >
                <Button
                    size="small"
                    color="inherit"
                    onClick={handleReset}
                >
                    Reset
                </Button>

                <Button
                    size="small"
                    variant="contained"
                    onClick={onClose}
                >
                    Apply
                </Button>
            </Box>
        </Menu>
    );
};

export default ColumnSelector;