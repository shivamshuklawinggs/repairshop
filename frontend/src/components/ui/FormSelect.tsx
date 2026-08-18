import React from 'react';
import Select, {
  Props as SelectProps,
  StylesConfig,
  components,
  MenuListProps,
  GroupBase,
  OptionsOrGroups,
} from 'react-select';

import { Box, Typography, useTheme, alpha } from '@mui/material';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps
  extends Omit<
    SelectProps<SelectOption, boolean, GroupBase<SelectOption>>,
    'options'
  > {
  label?: string;
  error?: string;
  options: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>;
  helperText?: string;
  required?: boolean;
  readOnly?: boolean;
  addNewLabel?: string;
  addNewModal?: React.ReactNode;
  showModal?: boolean;
  setShowModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  options,
  helperText,
  required,
  readOnly,
  styles,
  addNewLabel,
  addNewModal,
  showModal,
  setShowModal,
  ...selectProps
}) => {
  const theme = useTheme();

  const handleAddNewClick = () => {
    setShowModal?.(true);
  };

  const CustomMenuList = (
    props: MenuListProps<SelectOption, boolean, GroupBase<SelectOption>>
  ) => {
    return (
      <components.MenuList {...props}>
        {addNewLabel && !readOnly && (
          <Box
            onClick={handleAddNewClick}
            sx={{
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            <Typography
              color="primary"
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color:'#101721',
              }}
            >
              {addNewLabel}
            </Typography>
          </Box>
        )}

        {props.children}
      </components.MenuList>
    );
  };

  const customStyles: StylesConfig<
    SelectOption,
    boolean,
    GroupBase<SelectOption>
  > = {
    control: (base, state) => ({
      ...base,
      minHeight: '30px',

      borderColor: error
        ? theme.palette.error.main
        : state.isFocused
        ? theme.palette.primary.main
        : '#0000003b',

      boxShadow: error
        ? `0 0 0 1px ${theme.palette.error.main}`
        : state.isFocused
        ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`
        : 'none',

      backgroundColor: state.isDisabled
        ? '#f5f5f5'
        : theme.palette.background.paper,

      opacity: state.isDisabled ? 0.7 : 1,

      cursor: state.isDisabled ? 'not-allowed' : 'pointer',

      borderRadius: 4,

      fontSize: theme.typography.body2.fontSize,

      fontFamily: theme.typography.fontFamily,

      '&:hover': {
        borderColor: state.isDisabled
          ? '#0000003b'
          : error
          ? theme.palette.error.main
          : state.isFocused
          ? theme.palette.primary.main
          : '#5e5e5e',
      },

      transition: 'all 0.2s ease-in-out',
    }),

    option: (base, state) => ({
      ...base,

      backgroundColor: state.isFocused
        ? alpha(theme.palette.primary.main, 0.08)
        : state.isSelected
        ? alpha(theme.palette.primary.main, 0.12)
        : 'transparent',

      color: state.isSelected
        ? theme.palette.primary.main
        : theme.palette.text.primary,

      fontSize: theme.typography.body2.fontSize,

      fontFamily: theme.typography.fontFamily,

      cursor: 'pointer',

      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },

      transition: 'all 0.2s ease-in-out',
    }),

    menu: (base) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      borderRadius: 6,
      boxShadow: theme.shadows[8],
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menuList: (base) => ({
      ...base,
      padding: '1px',
      backgroundColor: theme.palette.background.paper,
    }),

    singleValue: (base, state) => ({
      ...base,

      color: state.isDisabled
        ? theme.palette.text.disabled
        : theme.palette.text.primary,

      fontSize: theme.typography.body2.fontSize,

      fontFamily: theme.typography.fontFamily,
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgb(56 62 75 / 12%)',
      borderRadius: 3,
      padding: '1px 4px',
      margin: '0px 4px',
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: '#101721',
      fontSize: theme.typography.body2.fontSize,
      fontFamily: theme.typography.fontFamily,
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: theme.palette.error.main,

      '&:hover': {
        backgroundColor: alpha(theme.palette.error.main, 0.2),
        color: theme.palette.error.main,
      },
    }),

    placeholder: (base, state) => ({
      ...base,

      color: state.isDisabled
        ? theme.palette.text.disabled
        : theme.palette.text.secondary,

      fontSize: theme.typography.body2.fontSize,

      fontFamily: theme.typography.fontFamily,
    }),

    indicatorSeparator: (base, state) => ({
      ...base,
      backgroundColor: state.isDisabled
        ? theme.palette.action.disabled
        : base.backgroundColor,
    }),

    dropdownIndicator: (base, state) => ({
      ...base,

      color: state.isDisabled
        ? theme.palette.action.disabled
        : base.color,

      cursor: state.isDisabled ? 'not-allowed' : 'pointer',

      '&:hover': {
        color: state.isDisabled
          ? theme.palette.action.disabled
          : theme.palette.text.primary,
      },
    }),

    input: (base, state) => ({
      ...base,
      color: state.isDisabled
        ? theme.palette.text.disabled
        : theme.palette.text.primary,
    }),

    ...styles,
  };

  return (
    <>
      <Box>
        {label && (
          <Typography
            variant="caption"
            color={error ? 'error' : 'textSecondary'}
            sx={{
              mb: 0.7,
              display: 'block',
              fontWeight: 600,
              fontSize: {xs:13, md:14},
              color: '#101721',
            }}
          >
            {label}

            {required && (
              <Typography
                component="span"
                color="error"
                sx={{
                  ml: 0.25,
                  fontSize: '0.875rem',
                }}
              >
                *
              </Typography>
            )}
          </Typography>
        )}

        <Select<SelectOption, boolean, GroupBase<SelectOption>>
          options={options}
          styles={customStyles}
          menuPortalTarget={document.body}
          components={
            addNewLabel
              ? {
                  MenuList: CustomMenuList,
                }
              : undefined
          }
          isDisabled={readOnly}
          {...selectProps}
        />

        {(error || helperText) && (
          <Typography
            variant="caption"
            color={error ? 'error' : 'textSecondary'}
            sx={{
              mt: 0.5,
              display: 'block',
              ml: 1.5,
              fontSize: '0.75rem',
              letterSpacing: '0.025em',
            }}
          >
            {error || helperText}
          </Typography>
        )}
      </Box>

      {addNewModal}
    </>
  );
};

export default FormSelect;