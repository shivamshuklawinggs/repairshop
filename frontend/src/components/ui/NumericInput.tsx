import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Control, Controller, ControllerProps, FieldValues, Path } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

export interface NumericInputProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'defaultValue' | 'type'> {
  value?: number;
  onChange?: (value: number | null) => void;
  decimalScale?: number;
  allowNegative?: boolean;
  thousandSeparator?: boolean | string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  MAX_LIMIT?:number
}

export interface ControlledNumericInputProps<T extends FieldValues> extends Omit<NumericInputProps, 'value' | 'onChange'> {
  name: Path<T>;
  control: Control<T>;
  rules?: ControllerProps<T>['rules'];
}

const NumericInputComponent: React.FC<NumericInputProps> = ({
  value,
  onChange,
  decimalScale = 2,
  // allowNegative = false,
  thousandSeparator = false,
  prefix = '',
  suffix = '',
  placeholder = '0.00',
  MAX_LIMIT,
  ...textFieldProps
}) => {
  return (
    <NumericFormat
    size='small'
      customInput={TextField}
      value={value || ''}
      onValueChange={(values: { floatValue?: number; formattedValue: string; value: string }) => {
        onChange?.(values.floatValue ?? null);
      }}
      isAllowed={(values) => {
        const { floatValue } = values;
        console.log("floatValue",floatValue)
        if (floatValue && MAX_LIMIT) {
          return floatValue <= MAX_LIMIT;
        }
        return true
      }}
      decimalScale={decimalScale}
      allowNegative={true}
      thousandSeparator={thousandSeparator}
      prefix={prefix}
      suffix={suffix}
      placeholder={placeholder}
      {...textFieldProps}
    />
  );
};

export const NumericInput = NumericInputComponent;

export const ControlledNumericInput = <T extends FieldValues>({
  name,
  control,
  rules,
  ...props
}: ControlledNumericInputProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <NumericInput
          value={field.value}
          onChange={field.onChange}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          {...props}
        />
      )}
    />
  );
};

export default NumericInput;
