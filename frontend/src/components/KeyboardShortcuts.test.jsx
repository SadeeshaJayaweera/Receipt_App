import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import AppLayout from './AppLayout';
import useAuthStore from '../store/authStore';
import * as ThemeContextModule from '../theme/ThemeContext';

vi.mock('../store/authStore');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockUser = {
  businessName: 'Fresh Citrus Juice Bar',
  email: 'owner@freshcitrus.lk',
  logoIcon: '🧃'
};

describe('Keyboard Shortcuts & Accessibility Suite', () => {
  let mockToggleTheme;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleTheme = vi.fn();

    useAuthStore.mockReturnValue({
      user: mockUser,
      logout: vi.fn()
    });

    vi.spyOn(ThemeContextModule, 'useThemeMode').mockReturnValue({
      mode: 'light',
      toggleTheme: mockToggleTheme
    });
  });

  const renderLayout = () => {
    const theme = getAppTheme('light');
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AppLayout title="Test Page">
            <div>Main Content Area</div>
          </AppLayout>
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders skip to main content link with correct anchor target', () => {
    renderLayout();

    const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('opens keyboard shortcuts dialog when keyboard icon button in header is clicked', () => {
    renderLayout();

    const shortcutsBtn = screen.getByLabelText(/keyboard shortcuts/i);
    expect(shortcutsBtn).toBeInTheDocument();
    fireEvent.click(shortcutsBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts & POS Keys')).toBeInTheDocument();
    expect(screen.getByText(/Create new receipt \(POS checkout\)/i)).toBeInTheDocument();
  });

  it('opens keyboard shortcuts dialog when ? key is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts & POS Keys')).toBeInTheDocument();
  });

  it('opens keyboard shortcuts dialog when F1 key is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F1' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts & POS Keys')).toBeInTheDocument();
  });

  it('navigates to /create-receipt when F2 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F2' });
    expect(mockNavigate).toHaveBeenCalledWith('/create-receipt');
  });

  it('navigates to /receipts when F3 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F3' });
    expect(mockNavigate).toHaveBeenCalledWith('/receipts');
  });

  it('navigates to /dashboard when F4 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F4' });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /flavours when F6 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F6' });
    expect(mockNavigate).toHaveBeenCalledWith('/flavours');
  });

  it('navigates to /settings when F9 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F9' });
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('toggles theme mode when F8 is pressed', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F8' });
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('closes shortcuts dialog when Got It button is clicked', async () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Got It/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
