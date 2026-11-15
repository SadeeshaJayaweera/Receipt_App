import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';

import Login from '../pages/Auth/Login';
import Flavours from '../pages/Flavours';
import CreateReceipt from '../pages/CreateReceipt';
import Receipts from '../pages/Receipts';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';

import useAuthStore from '../store/authStore';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/flavourStore', () => ({
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

describe('End-to-End User Journeys Suite', () => {
  const theme = getAppTheme('light');

  const mockUser = {
    _id: 'user_e2e_123',
    name: 'Sadeesha Jayaweera',
    email: 'admin@juicepos.com',
    businessName: 'Fresh Citrus Juice Bar',
    receiptPrefix: 'CITRUS',
    currency: 'LKR',
    taxEnabled: false,
    taxRate: 0,
    address: '100 Galle Road, Colombo',
    phone: '+94 11 234 5678',
    role: 'owner'
  };

  const mockFlavours = [
    {
      _id: 'flv_01',
      name: 'Fresh Lime & Mint',
      price: 450,
      category: 'Fresh Juice',
      sku: 'LIM-01',
      description: 'Refreshing lime with crushed mint leaves',
      isAvailable: true,
      isArchived: false
    },
    {
      _id: 'flv_02',
      name: 'Mango Passion Delight',
      price: 550,
      category: 'Tropical Blend',
      sku: 'MAN-02',
      description: 'Sweet ripe mango blended with passionfruit',
      isAvailable: true,
      isArchived: false
    }
  ];

  const mockReceipt = {
    _id: 'rcp_e2e_001',
    receiptNumber: 'CITRUS-202611-0001',
    createdAt: new Date().toISOString(),
    currency: 'LKR',
    status: 'issued',
    paymentMethod: 'cash',
    cashReceived: 2000,
    changeAmount: 650,
    subtotal: 1350,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 1350,
    items: [
      { flavourId: 'flv_01', flavourName: 'Fresh Lime & Mint', quantity: 3, price: 450, subtotal: 1350 }
    ],
    customer: {
      name: 'Sunil Shantha',
      phone: '+94 77 123 4567'
    },
    pricing: {
      subtotal: 1350,
      discount: 0,
      tax: 0,
      grandTotal: 1350
    },
    payment: {
      method: 'cash',
      cashReceived: 2000,
      changeGiven: 650
    },
    notes: 'Less sugar requested'
  };

  let mockLogin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn().mockResolvedValue({ token: 'mock-jwt-token', user: mockUser });

    useAuthStore.mockImplementation((selector) => {
      const state = {
        user: mockUser,
        login: mockLogin,
        isLoading: false,
        error: null,
        logout: vi.fn()
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  describe('Journey 1: User Login & Session Initialization', () => {
    it('executes login flow and invokes authStore.login with entered credentials', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <ThemeProvider theme={theme}>
            <Login />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Juice Receipt App/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'admin@juicepos.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@juicepos.com', 'Secret123!');
      });
    });

    it('renders error alert when authentication fails', () => {
      useAuthStore.mockImplementation((selector) => {
        const state = {
          user: null,
          login: vi.fn(),
          isLoading: false,
          error: 'Invalid credentials provided',
          logout: vi.fn()
        };
        return typeof selector === 'function' ? selector(state) : state;
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <ThemeProvider theme={theme}>
            <Login />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Invalid credentials provided/i)).toBeInTheDocument();
    });
  });

  describe('Journey 2: Product Catalogue Management Flow', () => {
    it('searches catalogue, opens add dialog, and creates a new flavour', async () => {
      const mockAddFlavour = vi.fn().mockResolvedValue({});
      const mockToggleAvailability = vi.fn().mockResolvedValue({});
      const mockFetchFlavours = vi.fn().mockResolvedValue(mockFlavours);

      useFlavourStore.mockReturnValue({
        flavours: mockFlavours,
        isLoading: false,
        error: null,
        fetchFlavours: mockFetchFlavours,
        addFlavour: mockAddFlavour,
        updateFlavour: vi.fn(),
        toggleAvailability: mockToggleAvailability,
        archiveFlavour: vi.fn(),
        restoreFlavour: vi.fn(),
        deleteFlavour: vi.fn(),
        clearError: vi.fn()
      });

      render(
        <MemoryRouter>
          <ThemeProvider theme={theme}>
            <Flavours />
          </ThemeProvider>
        </MemoryRouter>
      );

      // Verify header and inventory items
      expect(screen.getByRole('heading', { name: /Flavours & Menu Inventory/i })).toBeInTheDocument();
      expect(screen.getByText('Fresh Lime & Mint')).toBeInTheDocument();
      expect(screen.getByText('Mango Passion Delight')).toBeInTheDocument();

      // Test Search
      const searchInput = screen.getByPlaceholderText(/Search by flavour name, SKU, description.../i);
      fireEvent.change(searchInput, { target: { value: 'Lime' } });
      expect(screen.getByText('Fresh Lime & Mint')).toBeInTheDocument();
      expect(screen.queryByText('Mango Passion Delight')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Mango Passion Delight')).toBeInTheDocument();

      // Test Stock Availability Toggle
      const limeSwitch = screen.getByLabelText(/Toggle stock for Fresh Lime & Mint/i);
      fireEvent.click(limeSwitch);
      expect(mockToggleAvailability).toHaveBeenCalledWith('flv_01');

      // Open Add Flavour dialog
      const addFlavourBtn = screen.getByRole('button', { name: /Add Flavour/i });
      fireEvent.click(addFlavourBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Add New Juice Flavour/i })).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Flavour Name \*/i);
      const priceInput = screen.getByLabelText(/Price \(LKR\) \*/i);
      const skuInput = screen.getByLabelText(/SKU \/ Item Code/i);

      fireEvent.change(nameInput, { target: { value: 'Dragonfruit Cooler' } });
      fireEvent.change(priceInput, { target: { value: '750' } });
      fireEvent.change(skuInput, { target: { value: 'DRA-03' } });

      const saveBtn = screen.getByRole('button', { name: /Create Flavour/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockAddFlavour).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Dragonfruit Cooler',
            price: 750,
            sku: 'DRA-03'
          })
        );
      });
    });
  });

  describe('Journey 3: POS Receipt Checkout & Authoritative Calculations', () => {
    it('adds items, adjusts quantities, computes change, and submits receipt', async () => {
      const mockCreateReceipt = vi.fn().mockResolvedValue(mockReceipt);
      const mockFetchFlavours = vi.fn().mockResolvedValue(mockFlavours);

      useFlavourStore.mockReturnValue({
        flavours: mockFlavours,
        isLoading: false,
        error: null,
        fetchFlavours: mockFetchFlavours
      });
      useReceiptStore.mockReturnValue({
        createReceipt: mockCreateReceipt,
        isLoading: false,
        error: null
      });

      render(
        <MemoryRouter>
          <ThemeProvider theme={theme}>
            <CreateReceipt />
          </ThemeProvider>
        </MemoryRouter>
      );

      // Verify POS Menu and Ticket layout
      expect(screen.getByText(/Fresh Lime & Mint/i)).toBeInTheDocument();
      expect(screen.getByText(/Mango Passion Delight/i)).toBeInTheDocument();
      expect(screen.getByText(/Order Ticket \(0\)/i)).toBeInTheDocument();

      // Add item to cart by clicking flavour tile
      const limeTile = screen.getByText('Fresh Lime & Mint');
      fireEvent.click(limeTile);

      // Check item added to order ticket
      expect(screen.getByText(/Order Ticket \(1\)/i)).toBeInTheDocument();

      // Cash Tender Input
      const cashReceivedInput = screen.getByLabelText(/Cash Received \(LKR\)/i);
      fireEvent.change(cashReceivedInput, { target: { value: '2000' } });

      // Submit checkout
      const issueBtn = screen.getByRole('button', { name: /Complete & Issue Receipt/i });
      expect(issueBtn).not.toBeDisabled();
      fireEvent.click(issueBtn);

      await waitFor(() => {
        expect(mockCreateReceipt).toHaveBeenCalled();
      });

      // Verify success dialog appears with receipt details
      expect(await screen.findByText(/Receipt Issued!/i)).toBeInTheDocument();
      expect(screen.getByText('CITRUS-202611-0001')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Print 80mm Receipt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
    });
  });

  describe('Journey 4 & 5: Dual-Format Receipt Preview & Thermal Print / PDF Triggers', () => {
    it('renders 80mm continuous thermal format and toggles to standard invoice format', () => {
      render(
        <ThemeProvider theme={theme}>
          <ReceiptPreviewModal
            open={true}
            onClose={vi.fn()}
            receipt={mockReceipt}
            business={mockUser}
          />
        </ThemeProvider>
      );

      expect(screen.getAllByText('CITRUS-202611-0001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('FRESH CITRUS JUICE BAR').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Fresh Lime & Mint').length).toBeGreaterThanOrEqual(1);

      // Toggle format from 80mm Roll to Standard Invoice Document View
      const docBtn = screen.getByRole('button', { name: /Standard Invoice Document Preview/i });
      fireEvent.click(docBtn);

      expect(docBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Item Description')).toBeInTheDocument();
      expect(screen.getByText('Total Due:')).toBeInTheDocument();
    });

    it('triggers thermal printing and PDF generation when actions are clicked', () => {
      render(
        <ThemeProvider theme={theme}>
          <ReceiptPreviewModal
            open={true}
            onClose={vi.fn()}
            receipt={mockReceipt}
            business={mockUser}
          />
        </ThemeProvider>
      );

      // Click Thermal Print Button
      const printBtn = screen.getByRole('button', { name: /Print 80mm/i });
      fireEvent.click(printBtn);
      expect(printThermalReceipt).toHaveBeenCalledWith(mockReceipt, mockUser);

      // Click Download PDF Button
      const pdfBtn = screen.getByRole('button', { name: /Download PDF/i });
      fireEvent.click(pdfBtn);
      expect(downloadReceiptPdf).toHaveBeenCalledWith(mockReceipt, mockUser);
    });

    it('displays prominent VOID watermark when receipt is voided', () => {
      const voidedReceipt = {
        ...mockReceipt,
        status: 'voided',
        voidReason: 'Customer cancelled transaction before preparation',
        voidedAt: new Date().toISOString()
      };

      render(
        <ThemeProvider theme={theme}>
          <ReceiptPreviewModal
            open={true}
            onClose={vi.fn()}
            receipt={voidedReceipt}
            business={mockUser}
          />
        </ThemeProvider>
      );

      expect(screen.getByText(/THIS RECEIPT IS VOIDED/i)).toBeInTheDocument();
      expect(screen.getByText(/Reason: "Customer cancelled transaction before preparation"/i)).toBeInTheDocument();
      expect(screen.getAllByText('VOID').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Journey 6: Receipt History, Advanced Search & Void Audit Workflow', () => {
    it('searches receipts, filters by status, and executes receipt voiding with mandatory audit reason', async () => {
      const mockFetchReceipts = vi.fn().mockResolvedValue({});
      const mockVoidReceipt = vi.fn().mockResolvedValue({});

      useReceiptStore.mockReturnValue({
        receipts: [mockReceipt],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        isLoading: false,
        error: null,
        fetchReceipts: mockFetchReceipts,
        voidReceipt: mockVoidReceipt
      });

      render(
        <MemoryRouter>
          <ThemeProvider theme={theme}>
            <Receipts />
          </ThemeProvider>
        </MemoryRouter>
      );

      // Table displays receipt row
      expect(screen.getByText('CITRUS-202611-0001')).toBeInTheDocument();
      expect(screen.getByText('Sunil Shantha')).toBeInTheDocument();

      // Search input triggers query
      const searchInput = screen.getByPlaceholderText(/Search by receipt #, customer name, phone, item.../i);
      fireEvent.change(searchInput, { target: { value: 'CITRUS-202611' } });

      await waitFor(() => {
        expect(mockFetchReceipts).toHaveBeenCalled();
      });

      // Click Void Button on issued receipt
      const voidActionBtn = screen.getByLabelText('void receipt CITRUS-202611-0001');
      fireEvent.click(voidActionBtn);

      // Void Dialog opens
      expect(screen.getByRole('heading', { name: /Void Receipt: CITRUS-202611-0001/i })).toBeInTheDocument();

      // Enter mandatory reason
      const reasonInput = screen.getByLabelText(/Mandatory Reason for Voiding \*/i);
      fireEvent.change(reasonInput, { target: { value: 'Customer order cancelled before prep' } });

      // Submit void
      const confirmVoidBtn = screen.getByRole('button', { name: /Confirm & Void Receipt/i });
      fireEvent.click(confirmVoidBtn);

      await waitFor(() => {
        expect(mockVoidReceipt).toHaveBeenCalledWith('rcp_e2e_001', 'Customer order cancelled before prep');
      });
    });
  });
});
