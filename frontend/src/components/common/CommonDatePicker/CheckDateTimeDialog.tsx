import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
// import { DATE_PICKER_TIME_FORMAT, DEFAULT_TIMEZONE } from "@/config/constant";
import { getIcon } from "../icons/getIcon";
import AppDialog from '@/components/ui/AppDialog';
interface CheckDateTimeDialogProps {
  open: boolean;
  title: string;
  label: string;
  value: Date | null;
  onChange: (newValue: Date | null) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading?: boolean;
  disabledSave?: boolean;
  /** Optional: Custom upload component to render inside dialog */
  UploadComponent?: React.ReactNode;
}

const CheckDateTimeDialog: React.FC<CheckDateTimeDialogProps> = ({
  open,
  title,
  label,
  value,
  onChange,
  onClose,
  onSave,
  isLoading = false,
  disabledSave = false,
  UploadComponent,
}) => {
  return (
    <AppDialog open={open} onClose={onClose}>
      <DialogActions className="dialog-close">
        <Button onClick={onClose} sx={{color:'#fff'}}>
          {getIcon('CloseIcon')}
        </Button>
      </DialogActions>
      <DialogTitle className="dialog-title">{title}</DialogTitle>
        <DialogContent sx={{width:'450px', maxWidth:'100%'}}>
          <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            //minWidth: 450,
            mt: 2,
          }}
          >
          <DateTimePicker
            label={label}
            value={value}
            // timezone={DEFAULT_TIMEZONE}
            //format={DATE_PICKER_TIME_FORMAT}
            onChange={onChange}
            sx={{mt:1.2}}
            slotProps={{
            textField: {
              size: 'small', // 'small' or 'medium'
            },
          }}
          />
          {/* 🧩 Custom upload or additional component (passed from parent) */}
          {UploadComponent && <Box>{UploadComponent}</Box>}
          </Box>
        </DialogContent>
        <DialogActions className="dialog-action">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button
          variant="contained"
          onClick={onSave}
          disabled={isLoading || disabledSave}
          >
          {isLoading ? "Saving..." : "Save"}
         </Button>
        </DialogActions>
      </AppDialog>
  );
};

export default CheckDateTimeDialog;
