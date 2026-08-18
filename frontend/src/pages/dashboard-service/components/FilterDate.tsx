import React, { useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers";

import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setFromDateFilter, setToDateFilter } from "@/redux/Slice/DashboardSlice";
import { Dashboardtoday, dateFilterOptions } from "../constant";

import { Moment } from "moment";

const FilterDate: React.FC<{
  type:
  | "AccPayable"
  | "AccReceivable"
  | "Sales"
  | "Expenses"
  | "Profit&Loss"
  | "InvoicesAndBillsSummary";
}> = ({ type }) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(
    (state) => state.dashboard.dashboard.dateFilters[type]
  );

  const [mode, setMode] = useState<"preset" | "custom">("preset");

  const handlePresetChange = (e: any) => {
    const selected = dateFilterOptions.find(
      (o) => o.label === e.target.value
    );
    if(!selected){
      return;
    }
    if (selected?.value === "custom") {
      setMode("custom");
      return;
    }

    setMode("preset");
    dispatch(
      setFromDateFilter({
        type,
        value: selected?.value as Moment,
        customeDate:false
      })

    );
    dispatch(setToDateFilter({
      type,
      value: Dashboardtoday,
      customeDate:false
    }))
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ display: "flex", gap: 0.7}}>
        {/* Preset dropdown */}
        <TextField
          size="small"
          select
          defaultValue="Last Month"
          onChange={handlePresetChange}
          sx={{
            minWidth: 'auto',
            '& .MuiSelect-icon': {
              color: '#777271',
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
              py:0.5,
              px:1.5,
            },
          }}
        >
          {dateFilterOptions.map((option) => (
            <MenuItem key={option.label} value={option.label} sx={{ fontSize:'0.875rem', fontWeight:'400'}}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Custom date picker */}
      {mode === "custom" && (
  <Stack direction="row" spacing={0.7}>
    {/* FROM DATE */}
    <DatePicker
      label="From"
      value={value.fromDate}
      maxDate={value.toDate as Moment}
      onChange={(date) => {
        if (!date) return;

        dispatch(setFromDateFilter({ type, value: date, customeDate: true }));

        if (value.toDate && date.isAfter(value.toDate)) {
          dispatch(setToDateFilter({ type, value: null, customeDate: true }));
        }
      }}
      slotProps={{
        textField: {
          size: 'small', // 👈 makes it small
          sx: {
            '& .MuiSvgIcon-root': {
              color: '#777271', // 👈 calendar icon color
              fontSize: '1rem', // 👈 icon size (optional)
            },
            '& .MuiInputBase-input': {
              fontSize: '0.8rem',
              width:'80px',
              padding:'5px 0px 0px 10px',
              height:'auto',
              marginRight:'-15px',
            },
          },
        },
         // 👇 This controls the calendar popup arrows
          previousIconButton: {
            sx: {
              color: '#000',
            },
          },
          nextIconButton: {
            sx: {
              color: '#000',
            },
          },
          switchViewIcon: {
            sx: {
              color: '#000',
            },
          },
        }}
    />

    {/* TO DATE */}
    <DatePicker
      label="To"
      value={value.toDate}
      minDate={value.fromDate || undefined}

      onChange={(date) => {
        if (!date) return;
        dispatch(setToDateFilter({ type, value: date ,customeDate:true}));
      }}
     slotProps={{
        textField: {
          size: 'small', // 👈 makes it small
          sx: {
            '& .MuiSvgIcon-root': {
              color: '#777271', // 👈 calendar icon color
              fontSize: '1rem', // 👈 icon size (optional)
            },
            '& .MuiInputBase-input': {
              fontSize: '0.8rem',
              width:'80px',
              padding:'5px 0px 0px 10px',
              height:'auto',
              marginRight:'-15px',
            },
          },
        },
      // 👇 This controls the calendar popup arrows
          previousIconButton: {
            sx: {
              color: '#000',
            },
          },
          nextIconButton: {
            sx: {
              color: '#000',
            },
          },
          switchViewIcon: {
            sx: {
              color: '#000',
            },
          },
        }}
    />
  </Stack>
)}

      </Box>
    </LocalizationProvider>
  );
};

export default FilterDate;
