import { createTheme, Theme } from '@mui/material/styles';
import '@mui/x-date-pickers/themeAugmentation';
import {
  colorPresets,
  secondaryPresets,
  lightBackgrounds,
  semanticColors,
  fontFamilies,
  typographyScales,
  Colors,
} from './colors';

// Extended type for custom theme properties
interface CustomTheme {
  sidebarStyle: string;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarWidthCollapsed: number;
  sidebarWidthExpanded: number;
  headerHeight: number;
  formFont: any;
  formSizes: typeof formSizes;
  formContainerSpacing: typeof formContainerSpacing;
  formColors: {
    border: string;
    borderHover: string;
    borderFocus: string;
    background: string;
    placeholder: string;
  };
}

// Extend Theme interface
declare module '@mui/material/styles' {
  interface Theme {
    custom: CustomTheme;
  }
  interface ThemeOptions {
    custom?: Partial<CustomTheme>;
  }
}

/* ================================
   Color Utility Functions
================================ */

// Form size configurations
const formSizes = {
  small: {
    fontSize: '0.75rem',
    height: 32,
    padding: '6px 12px',
    borderRadius: 6,
    labelFontSize: '0.75rem',
    labelMb: 4,
  },
  medium: {
    fontSize: '0.875rem',
    height: 40,
    padding: '8px 16px',
    borderRadius: 8,
    labelFontSize: '0.875rem',
    labelMb: 6,
  },
  large: {
    fontSize: '1rem',
    height: 48,
    padding: '12px 20px',
    borderRadius: 10,
    labelFontSize: '1rem',
    labelMb: 8,
  },
};

// Form container spacing
const formContainerSpacing = {
  small: {
    gap: 1,
    mb: 2,
  },
  medium: {
    gap: 2,
    mb: 3,
  },
  large: {
    gap: 3,
    mb: 4,
  },
};

/* ================================
   Create App Theme (Typed)
================================ */

export const createAppTheme = (): Theme => {

  /* ───────── Resolve Tokens ───────── */

  // Handle primary color - support both color keys and direct hex values
  // let primary;
  // if (colorPresets[s.primaryColor as keyof typeof colorPresets]) {
  //   primary = colorPresets[s.primaryColor as keyof typeof colorPresets];
  // } else if (s.primaryColor.startsWith('#')) {
  //   // Direct hex color provided - create a preset object
  //   primary = {
  //     main: s.primaryColor,
  //     light: s.primaryColor + '20', // Add transparency for light
  //     dark: s.primaryColor + 'CC', // Darken slightly
  //     contrast: getContrastColor(s.primaryColor), // Use calculated contrast
  //   };
  // } else {
  //   // Fallback to teal if color not found
  //   primary = colorPresets.teal;
  // }
  const primary = colorPresets.darkSlate

  const secondary =
    secondaryPresets.slate;

  const bgPreset = lightBackgrounds.neutral;

  const typoScale =
    typographyScales.default;

  const fontFamily = fontFamilies.lato;

  const radius = 12

  /* ───────── Create Theme ───────── */

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: primary.main,
        light: primary.light,
        dark: primary.dark,
        contrastText: primary.contrast,
      },
      secondary: {
        main: secondary.main,
        light: secondary.light,
        dark: secondary.dark,
        contrastText: secondary.contrast,
      },
      background: {
        default: bgPreset.default,
        paper: bgPreset.paper,
      },
      text: {
        primary: '#101721',
        secondary: '#64748b',
      },
      success: {
        main: semanticColors.success.main,
        light: semanticColors.success.light,
        dark: semanticColors.success.dark,
        contrastText: semanticColors.success.contrastText || '#ffffff',
      },
      warning: {
        main: semanticColors.warning.main,
        light: semanticColors.warning.light,
        dark: semanticColors.warning.dark,
        contrastText: semanticColors.warning.contrastText || '#ffffff',
      },
      error: {
        main: semanticColors.error.main,
        light: semanticColors.error.light,
        dark: semanticColors.error.dark,
        contrastText: semanticColors.error.contrastText || '#ffffff',
      },
      info: {
        main: semanticColors.info.main,
        light: semanticColors.info.light,
        dark: semanticColors.info.dark,
        contrastText: semanticColors.info.contrastText || '#ffffff',
      },
      divider: '#e2e8f0',
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#101721',
        900: '#0f172a',
      },
      accent: {
        teal: '#00c9a7',
        tealLight: '#33d4b8',
        tealDark: '#00a08c',
        amber: '#f59e0b',
        amberLight: '#f7b547',
        amberDark: '#d97706',
      },
      status: {
        pending: {
          main: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
        },
        inTransit: {
          main: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.3)',
        },
        delivered: {
          main: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
        },
        cancelled: {
          main: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
        },
        paid: {
          main: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
        },
        overdue: {
          main: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
        },
      },
      action: {
        active: '#ffffff',
        hover: 'rgba(0, 0, 0, 0.04)',
        selected: 'rgba(0, 0, 0, 0.04)',
        focus: 'rgba(0, 0, 0, 0.04)',
      },
      charts: {
        revenue: {
          main: '#00c9a7',
          gradient: ['rgba(0, 201, 167, 0.3)', 'rgba(0, 201, 167, 0)'],
        },
        expense: {
          main: '#f59e0b',
          gradient: ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0)'],
        },
        profit: {
          main: '#10b981',
          gradient: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0)'],
        },
        series: ['#00C9A7', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
      },
      border: {
        main: '#334155',
        light: '#475569',
        accent: 'rgba(0, 201, 167, 0.3)',
      },
      glass: {
        background: 'rgba(30, 41, 59, 0.8)',
        border: 'rgba(148, 163, 184, 0.1)',
      },
    },

    shape: {
      borderRadius: radius,
    },

    typography: {
      fontFamily,
      htmlFontSize: typoScale.htmlFontSize,
      fontSize: typoScale.fontSize,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
    },

    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 0 20px rgba(59, 59, 59, 0.35)',
      '0 0 30px rgba(59, 59, 59, 0.35)',
      '0 0 40px rgba(59, 59, 59, 0.35)',
      '0 10px 40px rgba(0, 0, 0, 0.2)',
      '0 15px 50px rgba(0, 0, 0, 0.25)',
      '0 20px 60px rgba(0, 0, 0, 0.3)',
      '0 25px 70px rgba(0, 0, 0, 0.35)',
      '0 30px 80px rgba(0, 0, 0, 0.4)',
      '0 35px 90px rgba(0, 0, 0, 0.45)',
      '0 40px 100px rgba(0, 0, 0, 0.5)',
      '0 45px 110px rgba(0, 0, 0, 0.55)',
      '0 50px 120px rgba(0, 0, 0, 0.6)',
      '0 55px 130px rgba(0, 0, 0, 0.65)',
      '0 60px 140px rgba(0, 0, 0, 0.7)',
      '0 65px 150px rgba(0, 0, 0, 0.75)',
      '0 70px 160px rgba(0, 0, 0, 0.8)',
      '0 75px 170px rgba(0, 0, 0, 0.85)',
      '0 80px 180px rgba(0, 0, 0, 0.9)',
    ],

    // Custom Override CSS

    components: {
      MuiTableContainer: {
        styleOverrides: {
          root: {
            //maxHeight: '500px',
            overflowY: 'auto',
            /* Scrollbar Styling */
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#bdbdbd',
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#9e9e9e',
            },

            /* Firefox */
            scrollbarWidth: 'thin',
            scrollbarColor: '#bdbdbd #f1f1f1',
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            borderColor: '#e0e0e0',
            padding: '5px 15px',
            fontWeight: '400',
            textTransform: 'capitalize',
            cursor: 'default',

            '@media (max-width:580px)': {
              fontSize: '13px',
            },

          },
          head: {
            fontSize: '14px',
            textTransform: 'capitalize',
            fontWeight: '600',
            backgroundColor: '#383e4b24',
            lineHeight: '1.15rem',

            '@media (max-width:580px)': {
              fontSize: '13px',
            },
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },

      MuiTablePagination: {
        styleOverrides: {
          root: {
            fontSize: '0.8rem',
            color: '#101721',
          },
          toolbar: {
            paddingLeft: '10px',
            paddingRight: '10px',
            minHeight: '36px',
          },
          selectLabel: {
            fontSize: '0.8rem',
            fontWeight: 500,
          },
          displayedRows: {
            fontSize: '0.8rem',
            fontWeight: 500,
          },
          select: {
            fontSize: '0.8rem',
          },
          actions: {
            '& .MuiIconButton-root': {
              color: '#101721',
              padding: '6px',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.1rem',
            },
          },
        },
      },

      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            backgroundColor: '#f8fafc',
          },
          label: {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#101721',
          },
          switchViewButton: {
            color: '#101721', // year dropdown arrow
          },
        },
      },

      MuiPickersArrowSwitcher: {
        styleOverrides: {
          root: {
            '& .MuiIconButton-root': {
              color: '#101721', // month arrows
            },
          },
        },
      },

      MuiPickersDay: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            borderRadius: 6,

            '&.Mui-selected': {
              backgroundColor: '#006fc9',
              color: '#fff',
            },

            '&:hover': {
              backgroundColor: '#e2e8f0',
            },
          },
        },
      },

      MuiInputAdornment: {
        styleOverrides: {
          root: {
            '& .MuiSvgIcon-root': {
              color: '#575757',
              fontSize: '1rem',
            },
          },
        },
      },

      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: "0.875rem",
          },
          input: {
            '&::placeholder': {
              fontSize: '0.875rem', // placeholder font size
              opacity: 1,          // keeps placeholder fully visible
              color: '#94a3b8',    // optional placeholder color
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
          shrink: {
            fontSize: '0.875rem',
          },
          outlined: {
            fontSize: '0.875rem',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          root: {
            textTransform: 'none',
            borderRadius: '7px',
          },
          startIcon: {
            '& .MuiSvgIcon-root': {
              fontSize: 15,
            },
          },
          endIcon: {
            '& .MuiSvgIcon-root': {
              fontSize: 15,
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            background: '#fff',
            fontSize: '0.875rem',
            '& .MuiSvgIcon-root': {
              color: '#101721',
              fontSize: '1rem',
            },
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          select: {
            fontSize: "0.875rem",
            background: '#fff',
          },
          icon: {
            color: "#101721", // change arrow color here
            fontSize: "1rem", // optional: change arrow size
          },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.875rem",
            padding: '3px 16px',
            minHeight: 'auto',
          },
        },
      },

      MuiAutocomplete: {
        styleOverrides: {
          inputRoot: {
            fontSize: "0.875rem",
          },
          option: {
            fontSize: "0.875rem",
            padding: "3px 16px",
            minHeight: 'auto !important',
          },
          paper: {
            boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.23)", // dark shadow
            borderRadius: "8px", // optional
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '16px !important',
            "@media (max-width:600px)": {
              margin: "15px",
              width: "100%",
            },
          },
        },
      },

      MuiFormLabel: {
        styleOverrides: {
          asterisk: {
            color: "#c62828",
          },
        },
      },

    }

    //Custom Override CSS

  });
  return theme;
};

// Re-export Colors for other modules
export { Colors };

export default createAppTheme;