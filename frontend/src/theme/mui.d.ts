import { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    sidebar?: {
      main?: string;
    };
    accent?: {
      teal: string;
      tealLight: string;
      tealDark: string;
      amber: string;
      amberLight: string;
      amberDark: string;
    };
    status?: {
      pending: {
        main: string;
        bg: string;
        border: string;
      };
      inTransit: {
        main: string;
        bg: string;
        border: string;
      };
      delivered: {
        main: string;
        bg: string;
        border: string;
      };
      cancelled: {
        main: string;
        bg: string;
        border: string;
      };
      paid: {
        main: string;
        bg: string;
        border: string;
      };
      overdue: {
        main: string;
        bg: string;
        border: string;
      };
    };
    charts?: {
      revenue: {
        main: string;
        gradient: [string, string];
      };
      expense: {
        main: string;
        gradient: [string, string];
      };
      profit: {
        main: string;
        gradient: [string, string];
      };
      series: string[];
    };
    border?: {
      main: string;
      light: string;
      accent: string;
    };
    glass?: {
      background: string;
      border: string;
    };
  }

  interface PaletteOptions {
    sidebar?: {
      main?: string;
    };
    accent?: {
      teal?: string;
      tealLight?: string;
      tealDark?: string;
      amber?: string;
      amberLight?: string;
      amberDark?: string;
    };
    status?: {
      pending?: {
        main?: string;
        bg?: string;
        border?: string;
      };
      inTransit?: {
        main?: string;
        bg?: string;
        border?: string;
      };
      delivered?: {
        main?: string;
        bg?: string;
        border?: string;
      };
      cancelled?: {
        main?: string;
        bg?: string;
        border?: string;
      };
      paid?: {
        main?: string;
        bg?: string;
        border?: string;
      };
      overdue?: {
        main?: string;
        bg?: string;
        border?: string;
      };
    };
    charts?: {
      revenue?: {
        main?: string;
        gradient?: [string, string];
      };
      expense?: {
        main?: string;
        gradient?: [string, string];
      };
      profit?: {
        main?: string;
        gradient?: [string, string];
      };
      series?: string[];
    };
    border?: {
      main?: string;
      light?: string;
      accent?: string;
    };
    glass?: {
      background?: string;
      border?: string;
    };
  }

  interface Theme {
    custom: {
      sidebarStyle: string;
      sidebarCollapsed: boolean;
      sidebarWidth: number;
      sidebarWidthCollapsed: number;
      sidebarWidthExpanded: number;
      headerHeight: number;
      formFont: any;
    };
  }

  interface ThemeOptions {
    custom?: Theme['custom'];
  }
}