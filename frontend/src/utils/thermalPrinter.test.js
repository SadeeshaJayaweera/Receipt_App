import { describe, it, expect, vi } from 'vitest';
import { generateThermalReceiptHtml, printThermalReceipt } from './thermalPrinter';

describe('Thermal Printer 80mm Utility', () => {
  const sampleReceipt = {
    receiptNumber: 'RCP-202611-0005',
    createdAt: '2026-11-15T14:30:00Z',
    currency: 'LKR',
    status: 'issued',
    customer: { name: 'Nimal Silva', phone: '0771234567' },
    items: [
      { flavourName: 'Passionfruit Delight', quantity: 3, subtotal: 1350 },
      { flavourName: 'Mango Lime Juice', quantity: 1, subtotal: 400 }
    ],
    pricing: { subtotal: 1750, discount: 50, tax: 0, grandTotal: 1700 },
    payment: { method: 'cash', amountPaid: 2000, changeGiven: 300 },
    notes: 'No ice please'
  };

  const business = {
    businessName: 'Colombo Juice Co',
    phone: '0119876543',
    address: '15 Havelock Road, Colombo 05',
    email: 'info@colombojuice.lk',
    receiptFooter: 'Best juices in town!'
  };

  it('generates thermal HTML with 80mm dimensions and monospace typography', () => {
    const html = generateThermalReceiptHtml(sampleReceipt, business);

    expect(html).toContain('size: 80mm auto');
    expect(html).toContain('width: 80mm');
    expect(html).toContain("'Courier New'");
    expect(html).toContain('COLOMBO JUICE CO');
    expect(html).toContain('Tel: 0119876543');
    expect(html).toContain('15 Havelock Road');
    expect(html).toContain('RCP-202611-0005');
    expect(html).toContain('Nimal Silva');
    expect(html).toContain('0771234567');
  });

  it('correctly lists all line items, quantities, and formatted currency', () => {
    const html = generateThermalReceiptHtml(sampleReceipt, business);

    expect(html).toContain('Passionfruit Delight');
    expect(html).toContain('Mango Lime Juice');
    expect(html).toContain('Rs. 1,350.00');
    expect(html).toContain('Rs. 400.00');
    expect(html).toContain('TOTAL:');
    expect(html).toContain('Rs. 1,700.00');
    expect(html).toContain('Tendered:');
    expect(html).toContain('Rs. 2,000.00');
    expect(html).toContain('Change:');
    expect(html).toContain('Rs. 300.00');
  });

  it('renders voided and draft status notices prominently', () => {
    const voidedHtml = generateThermalReceiptHtml({ ...sampleReceipt, status: 'voided' }, business);
    const draftHtml = generateThermalReceiptHtml({ ...sampleReceipt, status: 'draft' }, business);

    expect(voidedHtml).toContain('*** VOIDED RECEIPT ***');
    expect(draftHtml).toContain('*** DRAFT RECEIPT ***');
  });

  it('supports USD receipts with $ symbols', () => {
    const usdReceipt = {
      ...sampleReceipt,
      currency: 'USD',
      items: [{ flavourName: 'Berry Blend', quantity: 1, subtotal: 5.5 }],
      pricing: { subtotal: 5.5, discount: 0, tax: 0, grandTotal: 5.5 },
      payment: { method: 'card', amountPaid: 5.5, changeGiven: 0 }
    };

    const html = generateThermalReceiptHtml(usdReceipt, business);
    expect(html).toContain('$5.50');
    expect(html).toContain('CARD');
  });

  it('printThermalReceipt creates a hidden iframe without errors', () => {
    const result = printThermalReceipt(sampleReceipt, business);
    expect(result).toBe(true);
    const iframe = document.getElementById('thermal-print-iframe');
    expect(iframe).toBeDefined();
    expect(iframe?.style.position).toBe('fixed');
  });
});
