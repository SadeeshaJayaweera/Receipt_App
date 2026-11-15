import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getAppTheme } from './theme';
import { tokens } from './tokens';
import { AppThemeProvider, useThemeMode } from './ThemeContext';

describe('Material UI Theme Foundation', () => {
  it('creates light theme with designated emerald primary and light surfaces', () => {
    const lightTheme = getAppTheme('light');
    expect(lightTheme.palette.mode).toBe('light');
    expect(lightTheme.palette.primary.main).toBe(tokens.colors.primary.main);
    expect(lightTheme.palette.background.default).toBe(tokens.colors.light.background);
    expect(lightTheme.palette.background.paper).toBe(tokens.colors.light.paper);
    expect(lightTheme.shape.borderRadius).toBe(tokens.shape.borderRadius);
  });

  it('creates dark theme with dark slate background and paper surfaces', () => {
    const darkTheme = getAppTheme('dark');
    expect(darkTheme.palette.mode).toBe('dark');
    expect(darkTheme.palette.background.default).toBe(tokens.colors.dark.background);
    expect(darkTheme.palette.background.paper).toBe(tokens.colors.dark.paper);
    expect(darkTheme.palette.text.primary).toBe(tokens.colors.dark.textPrimary);
  });

  it('configures button overrides with disableElevation and textTransform none', () => {
    const theme = getAppTheme('light');
    expect(theme.components.MuiButton.defaultProps.disableElevation).toBe(true);
    expect(theme.typography.button.textTransform).toBe('none');
    expect(theme.components.MuiCard.styleOverrides.root.borderRadius).toBe(tokens.shape.cardRadius);
  });

  const ThemeConsumer = () => {
    const { mode, toggleTheme } = useThemeMode();
    return (
      <div>
        <span data-testid="current-mode">{mode}</span>
        <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
      </div>
    );
  };

  it('AppThemeProvider provides theme mode context and allows toggling', () => {
    render(
      <AppThemeProvider>
        <ThemeConsumer />
      </AppThemeProvider>
    );

    const modeDisplay = screen.getByTestId('current-mode');
    const initialMode = modeDisplay.textContent;
    expect(['light', 'dark']).toContain(initialMode);

    const toggleBtn = screen.getByTestId('toggle-btn');
    act(() => {
      toggleBtn.click();
    });

    const expectedNext = initialMode === 'light' ? 'dark' : 'light';
    expect(screen.getByTestId('current-mode').textContent).toBe(expectedNext);
  });
});
