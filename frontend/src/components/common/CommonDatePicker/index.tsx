import React from "react";
import {
  DatePicker,
  TimePicker,
  MobileTimePicker,
  DateTimePicker
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { SxProps, Theme } from '@mui/material/styles';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DATE_PICKER_TIME_FORMAT } from "@/config/constant";
interface CustomDatePickerProps {
  name: string;
  value?: string | Date | null;
  readOnly?: boolean;
  onChange: (e: { target: { name: string; value: string } }) => void;
  required?: boolean;
  placeholder?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  isTimePicker?: boolean;
  isMobileTimePicker?: boolean;
  className?: string;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium" ;
  fullWidth?: boolean;
  disabled?:boolean;
  sx?: SxProps<Theme>;
  isDateTimePicker?:boolean
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  name,
  value = null,
  readOnly = false,
  onChange,
  required = false,
  placeholder = "Select Date/Time",
  label = "Date/Time",
  minDate,
  maxDate,
  isTimePicker = false,
  isMobileTimePicker = false,
  isDateTimePicker = false,
  className = "form-control",
  error = false,
  helperText = "",
  size = "medium",
  fullWidth = false,
  disabled=false,
  sx
}) => {
  // 🔹 Convert stored string value ("HH:mm" or ISO date) to Date object for pickers
  const parseValue = (val: string | Date | null) => {
    if (!val) return null;
    if (typeof val === "string") {

      if (isTimePicker || isMobileTimePicker) {
        const [hours, minutes] = val.split(":").map(Number);
        const date = new Date();
        date.setHours(hours || 0, minutes || 0, 0, 0);
        return date;
      }
      return new Date(val);
    }
    return val;
  };

  // 🔹 Handle change and return only "HH:mm" for time pickers, or full ISO date for DatePicker
  const handleChange = (newValue: Date | null) => {
    if (!newValue) {
      onChange({ target: { name, value: "" } });
      return;
    }

    let formattedValue = "";
    if (isTimePicker || isMobileTimePicker) {
      const hours = newValue.getHours().toString().padStart(2, "0");
      const minutes = newValue.getMinutes().toString().padStart(2, "0");
      formattedValue = `${hours}:${minutes}`; // ⏱ only time string
    } else {
      formattedValue = newValue.toISOString(); // 📅 full ISO date string
    }

    onChange({ target: { name, value: formattedValue } });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {isMobileTimePicker ? (
        <MobileTimePicker
          label={label}
          // timezone={DEFAULT_TIMEZONE}
          value={parseValue(value)}
          onChange={handleChange}
          disabled={readOnly}
          ampm={false} // show 24h format
          slotProps={{
            textField: {
              required,
              className,
              placeholder,
              fullWidth: true,
              error,
              helperText,
              size,
              sx:sx
            },
          }}
        />
      ):isDateTimePicker ? (
        <DateTimePicker
          label={label}
          // timezone={DEFAULT_TIMEZONE}
          value={parseValue(value)}
          onChange={handleChange}
          disabled={readOnly}
          sx={{mt:1.2}}
            slotProps={{
            textField: {
              size: 'small', // 'small' or 'medium'
            },
          }}
        />
      )  : isTimePicker ? (
        <TimePicker
          label={label}
          format={DATE_PICKER_TIME_FORMAT}
          value={parseValue(value)}
          // timezone={DEFAULT_TIMEZONE}
          onChange={handleChange}
          disabled={readOnly}
          ampm={false} // ⏱ 24h mode
          slotProps={{
            textField: {
              required,
              className,
              placeholder,
              fullWidth: true,
              error,
              helperText,
              size,
              sx:sx
            },
          }}
        />
      ) : (
        <DatePicker
          label={label}
          format={DATE_PICKER_TIME_FORMAT}
          value={parseValue(value)}
          // timezone={DEFAULT_TIMEZONE}
          onChange={handleChange}
          disabled={disabled || readOnly}
          minDate={minDate ? parseValue(minDate) || undefined : undefined}
          maxDate={maxDate ? parseValue(maxDate) || undefined : undefined}
          slotProps={{
            textField: {
              required,
              className,
              placeholder,
              fullWidth: fullWidth,
              error,
              helperText,
              size,
              sx:sx
            },
          }}
        />
      )}
    </LocalizationProvider>
  );
};

export default CustomDatePicker;
