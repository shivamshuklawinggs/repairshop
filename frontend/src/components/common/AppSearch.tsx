// components/common/AppSearch.tsx

import React, { useEffect, useState } from 'react';
import { TextField, InputAdornment, SxProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Theme } from '@mui/material/styles';

interface AppSearchProps {
  value: string;
  onSearch: (value: string) => void; // debounced callback
  placeholder?: string;
  delay?: number;
   sx?: SxProps<Theme>;
  fullWidth?:boolean
}

const AppSearch: React.FC<AppSearchProps> = ({
  value = '',
  onSearch,
  placeholder = 'Search...',
  delay = 500,
  sx,
  fullWidth=false
}) => {
  const [input, setInput] = useState(value);

  // sync external value
  useEffect(() => {
    setInput(value);
  }, [value]);

  // debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(input);
    }, delay);

    return () => clearTimeout(timer);
  }, [input]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
  };

  return (
    <TextField
      size="small"
      value={input}
      onChange={handleChange}
      placeholder={placeholder}
      fullWidth={fullWidth}
      variant="outlined"
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default AppSearch;