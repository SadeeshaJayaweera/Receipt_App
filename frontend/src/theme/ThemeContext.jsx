import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from './theme';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {}
});

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within an AppThemeProvider');
  }
  return context;
};

export const AppThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('receipt_app_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const setMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setModeState(newMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('receipt_app_theme', newMode);
      }
    }
  };

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [mode]);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    setMode
  }), [mode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
