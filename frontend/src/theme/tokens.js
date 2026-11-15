/**
 * Production-ready design tokens for Receipt App.
 * Built for clarity, high contrast, balanced SaaS aesthetic, and thermal compatibility.
 */

export const tokens = {
  colors: {
    primary: {
      main: '#10b981', // Emerald 500
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f59e0b', // Amber 500
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff'
    },
    success: {
      main: '#10b981',
      light: '#d1fae5',
      dark: '#047857',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#b45309',
      contrastText: '#ffffff'
    },
    error: {
      main: '#ef4444',
      light: '#fee2e2',
      dark: '#b91c1c',
      contrastText: '#ffffff'
    },
    info: {
      main: '#3b82f6',
      light: '#dbeafe',
      dark: '#1d4ed8',
      contrastText: '#ffffff'
    },
    light: {
      background: '#f8fafc', // Slate 50
      paper: '#ffffff',
      surface: '#f1f5f9',
      border: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b'
    },
    dark: {
      background: '#0f172a', // Slate 900
      paper: '#1e293b',     // Slate 800
      surface: '#334155',    // Slate 700
      border: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8'
    }
  },
  shape: {
    borderRadius: 10,
    cardRadius: 12,
    buttonRadius: 8
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    monoFontFamily: [
      '"Courier New"',
      'Courier',
      '"Lucida Console"',
      'Monaco',
      'monospace'
    ].join(',')
  }
};
