import React, { useState } from "react";
import { Box, TextField, InputAdornment, Popover } from "@mui/material";
import { CalendarToday as CalendarIcon } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
// import { DEFAULT_TIMEZONE } from "@/config/constant";

interface SingleDatePickerProps {
  name: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  name,
  value = null,
  onChange,
  label = "Select Date",
  placeholder = "MM/DD/YYYY",
  required = false,
  disabled = false,
  error = false,
  helperText = "",
  size = "medium",
  fullWidth = false,
  minDate,
  maxDate,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDateChange = (newValue: Date | null) => {
    onChange(newValue);
    handleClose();
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className={className}>
        <TextField 
          fullWidth={fullWidth}
          required={required}
          error={error}
          helperText={helperText}
          size={"small"}
          disabled={disabled}
          placeholder={placeholder}
          label={label}
          value={formatDateDisplay(value)}
          onClick={handleClick}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon 
                  sx={{ 
                    color: "text.secondary", 
                    fontSize: 20,
                    cursor: "pointer"
                  }} 
                />
              </InputAdornment>
            ),
            sx: {
              cursor: "pointer",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.87)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            },
          }}
        />
        
        <Popover
          open={isOpen}
          anchorEl={document.body}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
              borderRadius: 2,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <DatePicker
              value={value}
              onChange={handleDateChange}
              disabled={disabled}
              minDate={minDate}
              maxDate={maxDate}
              view="day"
              // timezone={DEFAULT_TIMEZONE}
              open={true}
              onClose={handleClose}
              slotProps={{
                toolbar: {
                  hidden: true,
                },
                actionBar: {
                  actions: ["clear", "accept"],
                },
              }}
            />
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};

export default SingleDatePicker;
