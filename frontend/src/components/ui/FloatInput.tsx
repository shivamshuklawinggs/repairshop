import React from "react";
import { TextField,TextFieldProps } from "@mui/material";

interface FloatInputProps extends Omit<TextFieldProps, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

const FloatInput: React.FC<FloatInputProps> = ({ value, onChange, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string, digits, and decimal point
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <TextField
      {...props}
      size="small"
      value={value}
      onChange={handleChange}
      inputProps={{
        inputMode: "decimal", // Mobile numeric keyboard with decimal
        pattern: "[0-9]*\\.?[0-9]*",
      }}
    />
  );
};

export default FloatInput;
