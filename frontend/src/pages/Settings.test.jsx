import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import Settings from './Settings';
import useAuthStore from '../store/authStore';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

vi.mock('../store/authStore');
vi.mock('../utils/thermalPrinter', () => ({
  printThermalReceipt: vi.fn()
}));
vi.mock('../utils/pdfGenerator', () => ({
  downloadReceiptPdf: vi.fn()
}));

const mockUser = {
  _id: 'u1',
  businessName: 'Fresh Citrus Juice Bar',
  email: 'owner@freshcitrus.lk',
  phone: '+94 11 234 5678',
  address: '42 Marine Drive, Colombo 03',
  website: 'www.freshcitrus.lk',
  tagline: '100% Pure Fruit Drinks',
  receiptPrefix: 'RCP',
  receiptFooter: 'Thank you for your visit!',
  logoIcon: '🧃',
  showLogo: true,
  showCustomerInfo: true,
  defaultCurrency: 'LKR',
  taxEnabled: true,
  taxRate: 2.5
};

describe('Settings Page UI', () => {
  let mockUpdateProfile;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile = vi.fn().mockResolvedValue({ user: mockUser });

    useAuthStore.mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      isLoading: false
    });
  });

  const renderSettings = () => {
    const theme = getAppTheme('light');
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders settings header, tabs, and live thermal receipt preview', () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: /Business Settings & Branding/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Store Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Receipt Branding/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Currency & Tax/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Printing Setup/i })).toBeInTheDocument();

    // Live preview
    expect(screen.getByText('Live Thermal Receipt Preview')).toBeInTheDocument();
    expect(screen.getByText('80mm Continuous')).toBeInTheDocument();
  });

  it('renders store profile fields with preloaded user data', () => {
    renderSettings();

    expect(screen.getByLabelText(/Business.*Name/i)).toHaveValue('Fresh Citrus Juice Bar');
    expect(screen.getByLabelText(/Tagline/i)).toHaveValue('100% Pure Fruit Drinks');
    expect(screen.getByLabelText(/Phone|Telephone/i)).toHaveValue('+94 11 234 5678');
    expect(screen.getByLabelText(/Website/i)).toHaveValue('www.freshcitrus.lk');
    expect(screen.getByLabelText(/Store Address|Address/i)).toHaveValue('42 Marine Drive, Colombo 03');
  });

  it('switches to Receipt Branding tab and displays branding controls', () => {
    renderSettings();

    const brandingTab = screen.getByRole('tab', { name: /Receipt Branding/i });
    fireEvent.click(brandingTab);

    expect(screen.getByText('Header Logo Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Show Logo on Receipts')).toBeChecked();
    expect(screen.getByLabelText('Show Customer Details')).toBeChecked();
    expect(screen.getByLabelText(/Receipt.*Prefix/i)).toHaveValue('RCP');
    expect(screen.getByLabelText(/Receipt Footer/i)).toHaveValue('Thank you for your visit!');
  });

  it('switches to Currency & Tax tab and updates tax settings', () => {
    renderSettings();

    const currencyTab = screen.getByRole('tab', { name: /Currency & Tax/i });
    fireEvent.click(currencyTab);

    expect(screen.getByLabelText(/Operating Currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Sales Tax')).toBeChecked();
    expect(screen.getByLabelText(/Tax.*Rate/i)).toHaveValue(2.5);
  });

  it('switches to Printing Setup tab and triggers test print and PDF download', () => {
    renderSettings();

    const printingTab = screen.getByRole('tab', { name: /Printing Setup/i });
    fireEvent.click(printingTab);

    expect(screen.getByLabelText(/Paper.*Width/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Auto-print on issue')).not.toBeChecked();

    const printBtn = screen.getByRole('button', { name: /Print Test 80mm Receipt/i });
    fireEvent.click(printBtn);
    expect(printThermalReceipt).toHaveBeenCalled();

    const pdfBtn = screen.getByRole('button', { name: /Download Sample PDF/i });
    fireEvent.click(pdfBtn);
    expect(downloadReceiptPdf).toHaveBeenCalled();
  });

  it('saves updated settings successfully and shows confirmation alert', async () => {
    renderSettings();

    const nameInput = screen.getByLabelText(/Business.*Name/i);
    fireEvent.change(nameInput, { target: { value: 'Fresh Citrus Juice Bar & Cafe' } });

    const saveButtons = screen.getAllByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Fresh Citrus Juice Bar & Cafe',
          defaultCurrency: 'LKR',
          receiptPrefix: 'RCP'
        })
      );
    });

    expect(await screen.findByText(/Business settings and branding updated successfully!/i)).toBeInTheDocument();
  });

  it('shows error banner when business name is left blank', async () => {
    renderSettings();

    const nameInput = screen.getByLabelText(/Business.*Name/i);
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const saveButtons = screen.getAllByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButtons[0]);

    expect(screen.getByText(/Business name is required/i)).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('handles server errors gracefully on save failure', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Network error updating profile'));
    renderSettings();

    const saveButtons = screen.getAllByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButtons[0]);

    expect(await screen.findByText(/Network error updating profile/i)).toBeInTheDocument();
  });
});
