import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const getAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  const modeColors = isDark ? tokens.colors.dark : tokens.colors.light;

  return createTheme({
    palette: {
      mode,
      primary: tokens.colors.primary,
      secondary: tokens.colors.secondary,
      success: tokens.colors.success,
      warning: tokens.colors.warning,
      error: tokens.colors.error,
      info: tokens.colors.info,
      background: {
        default: modeColors.background,
        paper: modeColors.paper
      },
      text: {
        primary: modeColors.textPrimary,
        secondary: modeColors.textSecondary
      },
      divider: modeColors.border
    },
    shape: {
      borderRadius: tokens.shape.borderRadius
    },
    typography: {
      fontFamily: tokens.typography.fontFamily,
      h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 },
      h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25 },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
      subtitle1: { fontSize: '0.9375rem', lineHeight: 1.5 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.875rem', lineHeight: 1.5 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            borderRadius: tokens.shape.buttonRadius,
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:active': {
              transform: 'scale(0.98)'
            }
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: tokens.colors.primary.dark
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.shape.cardRadius,
            border: `1px solid ${modeColors.border}`,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          },
          rounded: {
            borderRadius: tokens.shape.cardRadius
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: tokens.shape.buttonRadius,
            '& fieldset': {
              borderColor: modeColors.border
            },
            '&:hover fieldset': {
              borderColor: tokens.colors.primary.main
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${modeColors.border}`
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: modeColors.surface,
            '& .MuiTableCell-head': {
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: modeColors.textSecondary
            }
          }
        }
      }
    }
  });
};
