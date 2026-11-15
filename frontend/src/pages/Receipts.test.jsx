import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import Receipts from './Receipts';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/receiptStore', () => ({
  default: vi.fn()
}));

vi.mock('../utils/thermalPrinter', () => ({
  printThermalReceipt: vi.fn()
}));

vi.mock('../utils/pdfGenerator', () => ({
  downloadReceiptPdf: vi.fn()
}));

describe('Receipts History Page Suite', () => {
  const theme = getAppTheme('light');

  const mockUser = {
    _id: 'user123',
    name: 'Sadeesha',
    businessName: 'Fresh Citrus Juice Bar',
    currency: 'LKR',
    role: 'owner'
  };

  const mockReceipts = [
    {
      _id: 'r1',
      receiptNumber: 'RCP-202611-0001',
      createdAt: '2026-11-12T10:00:00.000Z',
      customerName: 'Kamal Perera',
      customer: { name: 'Kamal Perera', phone: '0771234567' },
      items: [{ flavourName: 'Fresh Lime & Mint', quantity: 2, price: 450, subtotal: 900 }],
      totalAmount: 900,
      paymentMethod: 'cash',
      status: 'issued',
      currency: 'LKR'
    },
    {
      _id: 'r2',
      receiptNumber: 'RCP-202611-0002',
      createdAt: '2026-11-12T11:00:00.000Z',
      customerName: 'Nimal Silva',
      items: [{ flavourName: 'Mango Passion Delight', quantity: 1, price: 550, subtotal: 550 }],
      totalAmount: 550,
      paymentMethod: 'card',
      status: 'draft',
      currency: 'LKR'
    },
    {
      _id: 'r3',
      receiptNumber: 'RCP-202611-0003',
      createdAt: '2026-11-12T12:00:00.000Z',
      customerName: 'Walk-in',
      items: [{ flavourName: 'Orange Burst', quantity: 1, price: 400, subtotal: 400 }],
      totalAmount: 400,
      paymentMethod: 'mobile',
      status: 'voided',
      voidReason: 'Accidental duplicate entry',
      currency: 'LKR'
    }
  ];

  let mockFetchReceipts;
  let mockVoidReceipt;
  let mockDeleteReceipt;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchReceipts = vi.fn().mockResolvedValue({
      receipts: mockReceipts,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });
    mockVoidReceipt = vi.fn().mockResolvedValue({ ...mockReceipts[0], status: 'voided' });
    mockDeleteReceipt = vi.fn().mockResolvedValue({ message: 'Deleted' });

    useAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: vi.fn() };
      return selector ? selector(state) : state;
    });

    useReceiptStore.mockReturnValue({
      receipts: mockReceipts,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      error: null,
      fetchReceipts: mockFetchReceipts,
      voidReceipt: mockVoidReceipt,
      deleteReceipt: mockDeleteReceipt
    });
  });

  const renderReceipts = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Receipts />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders receipt history page header, quick KPI cards, and table', () => {
    renderReceipts();

    expect(screen.getByRole('heading', { name: /Receipt History & Audit Log/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh receipts/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /New Receipt/i }).length).toBeGreaterThanOrEqual(1);

    // KPI cards
    expect(screen.getByText(/total records/i)).toBeInTheDocument();
    expect(screen.getByText(/issued receipts/i)).toBeInTheDocument();
    expect(screen.getByText(/draft tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/voided sales/i)).toBeInTheDocument();
  });

  it('renders receipts table with formatted receipt numbers, dates, customer names, and status chips', () => {
    renderReceipts();

    expect(screen.getByText('RCP-202611-0001')).toBeInTheDocument();
    expect(screen.getByText('Kamal Perera')).toBeInTheDocument();
    expect(screen.getByText('Rs. 900.00')).toBeInTheDocument();
    expect(screen.getByText('Issued')).toBeInTheDocument();

    expect(screen.getByText('RCP-202611-0002')).toBeInTheDocument();
    expect(screen.getByText('Nimal Silva')).toBeInTheDocument();
    expect(screen.getByText('Rs. 550.00')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();

    expect(screen.getByText('RCP-202611-0003')).toBeInTheDocument();
    expect(screen.getByText('Voided')).toBeInTheDocument();
  });

  it('triggers search query filtering when user types in search input', async () => {
    renderReceipts();

    const searchInput = screen.getByPlaceholderText(/Search by receipt #, customer name, phone, item.../i);
    fireEvent.change(searchInput, { target: { value: 'Kamal' } });

    await waitFor(() => {
      expect(mockFetchReceipts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Kamal'
        })
      );
    });
  });

  it('triggers thermal print when print icon button is clicked', () => {
    renderReceipts();

    const printBtn = screen.getByLabelText('print receipt RCP-202611-0001');
    fireEvent.click(printBtn);

    expect(printThermalReceipt).toHaveBeenCalledWith(mockReceipts[0], mockUser);
  });

  it('triggers PDF download when PDF icon button is clicked', () => {
    renderReceipts();

    const pdfBtn = screen.getByLabelText('download pdf for RCP-202611-0001');
    fireEvent.click(pdfBtn);

    expect(downloadReceiptPdf).toHaveBeenCalledWith(mockReceipts[0], mockUser);
  });

  it('opens ReceiptPreviewModal when view icon or row is clicked', () => {
    renderReceipts();

    const viewBtn = screen.getByLabelText('view receipt RCP-202611-0001');
    fireEvent.click(viewBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Receipt Preview')).toBeInTheDocument();
  });

  it('opens void dialog on issued receipt and submits mandatory reason', async () => {
    renderReceipts();

    const voidBtn = screen.getByLabelText('void receipt RCP-202611-0001');
    fireEvent.click(voidBtn);

    expect(screen.getByRole('heading', { name: /Void Receipt: RCP-202611-0001/i })).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Mandatory Reason for Voiding \*/i);
    fireEvent.change(reasonInput, { target: { value: 'Customer returned incorrect flavour' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Void Receipt/i });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockVoidReceipt).toHaveBeenCalledWith('r1', 'Customer returned incorrect flavour');
    });
  });

  it('renders friendly empty state when no receipts are found', () => {
    useReceiptStore.mockReturnValue({
      receipts: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      isLoading: false,
      error: null,
      fetchReceipts: mockFetchReceipts
    });

    renderReceipts();

    expect(screen.getByText(/No Receipts Recorded Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create New Receipt/i })).toBeInTheDocument();
  });
});
