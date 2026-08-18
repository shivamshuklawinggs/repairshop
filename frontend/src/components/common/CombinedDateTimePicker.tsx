import { FC } from "react";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from "moment";

interface CombinedDateTimePickerProps {
  value: Date | null | string;
  onChange: (date: Date | null) => void;
  label: string;
  name?: string;
  required?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  minDateTime?: Date;
  maxDateTime?: Date;
}

const CombinedDateTimePicker: FC<CombinedDateTimePickerProps> = ({
  value,
  onChange,
  label,
  name,
  required = false,
  size = 'small',
  fullWidth = true,
  disabled = false,
  minDateTime,
  maxDateTime
}) => {
  // Convert value to moment for the picker
  const momentValue = value ? moment(value) : null;

  const handleChange = (newValue: moment.Moment | null) => {
    if (newValue && newValue.isValid()) {
      onChange(newValue.toDate());
    } else {
      onChange(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DateTimePicker
        label={label}
        value={momentValue}
        onChange={handleChange}
        disabled={disabled}
        minDateTime={minDateTime ? moment(minDateTime) : undefined}
        maxDateTime={maxDateTime ? moment(maxDateTime) : undefined}
        slotProps={{
          textField: {
            size,
            fullWidth,
            required,
            name,
            variant: "outlined" as const,
          },
        }}
        viewRenderers={{
          hours: null,
          minutes: null,
          seconds: null,
        }}
        format="MM/DD/YYYY hh:mm A"
        ampm={true}
      />
    </LocalizationProvider>
  );
};

export default CombinedDateTimePicker;
