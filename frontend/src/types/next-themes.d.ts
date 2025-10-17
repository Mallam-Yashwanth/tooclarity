declare module 'next-themes' {
  import * as React from 'react';

  export interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: 'light' | 'dark' | 'system';
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    children?: React.ReactNode;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;

  export function useTheme(): {
    theme?: 'light' | 'dark' | 'system';
    systemTheme?: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
  };
}


