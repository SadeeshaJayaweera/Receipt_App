import { describe, it, expect, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { calculateReceiptHeightMm, generateReceiptPdf, downloadReceiptPdf } from './pdfGenerator';

describe('Frontend PDF Generator Utility', () => {
  const sampleReceipt = {
    receiptNumber: 'RCP-202611-0001',
    createdAt: '2026-11-15T12:00:00Z',
    currency: 'LKR',
    status: 'issued',
    customer: { name: 'Amara Fernando', phone: '0712345678' },
    items: [
      { flavourName: 'Mango Passion', quantity: 2, subtotal: 900 },
      { flavourName: 'Woodapple Freeze', quantity: 1, subtotal: 450 }
    ],
    pricing: { subtotal: 1350, discount: 50, tax: 0, grandTotal: 1300 },
    payment: { method: 'cash', amountPaid: 1500, changeGiven: 200 },
    notes: 'Extra cold'
  };

  const business = {
    businessName: 'Lanka Juice Spot',
    phone: '0112345678',
    address: 'High Level Road, Nugegoda',
    email: 'hello@juicespot.lk',
    receiptFooter: 'Thank you and visit us again!'
  };

  it('calculates dynamic height exceeding minimum threshold and growing with items', () => {
    const compactReceipt = { items: [{ flavourName: 'Lime', quantity: 1, subtotal: 150 }] };
    const compactHeight = calculateReceiptHeightMm(compactReceipt, {});
    const fullHeight = calculateReceiptHeightMm(sampleReceipt, business);

    expect(compactHeight).toBeGreaterThanOrEqual(140);
    expect(fullHeight).toBeGreaterThan(compactHeight);
  });

  it('generates a jsPDF instance successfully without throwing', () => {
    const pdfDoc = generateReceiptPdf(sampleReceipt, business);
    expect(pdfDoc).toBeDefined();
    expect(typeof pdfDoc.save).toBe('function');
  });

  it('downloadReceiptPdf generates expected formatted file name and pdf document', () => {
    const fileName = downloadReceiptPdf(sampleReceipt, business, { save: false });
    expect(fileName).toMatch(/^receipt-RCP-202611-0001-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
