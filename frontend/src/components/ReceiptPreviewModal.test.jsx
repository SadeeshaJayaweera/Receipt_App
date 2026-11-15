import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import useAuthStore from '../store/authStore';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../utils/thermalPrinter', () => ({
  printThermalReceipt: vi.fn()
}));

vi.mock('../utils/pdfGenerator', () => ({
  downloadReceiptPdf: vi.fn()
}));

describe('ReceiptPreviewModal Suite', () => {
  const theme = getAppTheme('light');

  const mockBusiness = {
    businessName: 'Fresh Citrus Juice Bar',
    tagline: 'Pure & Fresh Every Day',
    address: '123 Galle Road, Colombo',
    phone: '+94 11 234 5678',
    currency: 'LKR',
    receiptFooter: 'Thank you for your visit!'
  };

  const mockReceipt = {
    _id: 'r123',
    receiptNumber: 'RCP-202611-0008',
    status: 'issued',
    createdAt: '2026-11-12T14:30:00.000Z',
    currency: 'LKR',
    customerName: 'Sunil Shantha',
    paymentMethod: 'cash',
    items: [
      { flavourId: 'f1', flavourName: 'Fresh Lime & Mint', quantity: 2, price: 450, subtotal: 900 },
      { flavourId: 'f2', flavourName: 'Orange Burst', quantity: 1, price: 500, subtotal: 500 }
    ],
    pricing: {
      subtotal: 1400,
      discount: 100,
      tax: 0,
      grandTotal: 1300
    },
    payment: {
      method: 'cash',
      cashReceived: 1500,
      changeGiven: 200
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.mockImplementation((selector) => {
      const state = { user: mockBusiness };
      return selector ? selector(state) : state;
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue()
      }
    });
  });

  const renderModal = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <ReceiptPreviewModal
          open={true}
          onClose={vi.fn()}
          receipt={mockReceipt}
          business={mockBusiness}
          {...props}
        />
      </ThemeProvider>
    );
  };

  it('renders receipt preview modal with receipt number, items, and formatted amounts', () => {
    renderModal();

    expect(screen.getAllByText('RCP-202611-0008').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('FRESH CITRUS JUICE BAR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fresh Lime & Mint').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Orange Burst').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Rs. 1,300.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sunil Shantha').length).toBeGreaterThanOrEqual(1);
  });

  it('switches between 80mm thermal roll view and standard invoice document view', () => {
    renderModal();

    // Default is 80mm thermal view
    expect(screen.getByRole('button', { name: /80mm Thermal Roll Preview/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Switch to document view
    const docBtn = screen.getByRole('button', { name: /Standard Invoice Document Preview/i });
    fireEvent.click(docBtn);

    expect(docBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Item Description')).toBeInTheDocument();
    expect(screen.getByText('Total Due:')).toBeInTheDocument();
  });

  it('displays voided warning and watermark when receipt is voided', () => {
    const voidedReceipt = {
      ...mockReceipt,
      status: 'voided',
      voidReason: 'Customer changed drink selection',
      voidedAt: '2026-11-12T14:45:00.000Z'
    };

    renderModal({ receipt: voidedReceipt });

    expect(screen.getByText(/THIS RECEIPT IS VOIDED/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason: "Customer changed drink selection"/i)).toBeInTheDocument();
    expect(screen.getAllByText('VOID').length).toBeGreaterThanOrEqual(1);
  });

  it('displays draft warning when receipt is draft', () => {
    const draftReceipt = {
      ...mockReceipt,
      status: 'draft'
    };

    renderModal({ receipt: draftReceipt });

    expect(screen.getByText(/DRAFT TICKET - NOT YET FINALIZED/i)).toBeInTheDocument();
  });

  it('triggers printThermalReceipt when Print 80mm button is clicked', () => {
    renderModal();

    const printBtn = screen.getByRole('button', { name: /Print 80mm/i });
    fireEvent.click(printBtn);

    expect(printThermalReceipt).toHaveBeenCalledWith(mockReceipt, mockBusiness);
  });

  it('triggers downloadReceiptPdf when Download PDF button is clicked', () => {
    renderModal();

    const pdfBtn = screen.getByRole('button', { name: /Download PDF/i });
    fireEvent.click(pdfBtn);

    expect(downloadReceiptPdf).toHaveBeenCalledWith(mockReceipt, mockBusiness);
  });

  it('copies receipt text summary to clipboard when Copy Summary button is clicked', async () => {
    renderModal();

    const copyBtn = screen.getByRole('button', { name: /Copy Summary/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Receipt summary copied to clipboard!/i)).toBeInTheDocument();
  });
});
