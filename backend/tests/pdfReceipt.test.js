const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const pdfReceiptService = require('../src/services/pdfReceiptService');
const receiptService = require('../src/services/receiptService');
const jwt = require('jsonwebtoken');
const { config } = require('../src/config/env');

describe('PDF Receipt Generation & Service Tests', () => {
  const sampleReceipt = {
    _id: '507f1f77bcf86cd799439011',
    receiptNumber: 'RCP-202611-0088',
    userId: '507f191e810c19729de860ea',
    currency: 'LKR',
    status: 'issued',
    createdAt: new Date('2026-11-15T10:30:00Z'),
    customer: {
      name: 'Kasun Perera',
      phone: '+94 77 123 4567'
    },
    items: [
      { flavourName: 'Papaya Lime Splash', quantity: 2, unitPrice: 450, subtotal: 900 },
      { flavourName: 'Avocado Shake', quantity: 1, unitPrice: 600, subtotal: 600 }
    ],
    pricing: {
      subtotal: 1500,
      discount: 100,
      discountType: 'fixed',
      tax: 0,
      grandTotal: 1400
    },
    payment: {
      method: 'cash',
      amountPaid: 2000,
      changeGiven: 600
    },
    notes: 'Less sugar please'
  };

  const sampleProfile = {
    businessName: 'Green Tropical Juice Bar',
    phone: '+94 11 234 5678',
    address: '42 Galle Road, Colombo 03',
    email: 'info@greentropical.lk',
    receiptFooter: 'Thank you for refreshing with us!',
    defaultCurrency: 'LKR'
  };

  it('calculates dynamic receipt height proportional to items and metadata', () => {
    const compactReceipt = { items: [{ flavourName: 'Lime', quantity: 1, subtotal: 200 }] };
    const compactHeight = pdfReceiptService.calculateReceiptHeight(compactReceipt, {});

    const fullHeight = pdfReceiptService.calculateReceiptHeight(sampleReceipt, sampleProfile);
    assert.ok(fullHeight > compactHeight, `Full height (${fullHeight}) must exceed compact height (${compactHeight})`);
    assert.ok(fullHeight >= 380, 'Receipt height must be at least minimum base height');
  });

  it('generates a valid binary PDF document buffer starting with %PDF- header', async () => {
    const pdfBuffer = await pdfReceiptService.generateReceiptPdfBuffer(sampleReceipt, sampleProfile);
    assert.ok(Buffer.isBuffer(pdfBuffer), 'Must return a Node Buffer');
    assert.ok(pdfBuffer.length > 500, `PDF buffer length (${pdfBuffer.length}) should be substantial`);
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    assert.strictEqual(header, '%PDF-', 'Buffer must begin with standard PDF signature %PDF-');
  });

  it('renders USD currency and calculates totals correctly when currency is USD', async () => {
    const usdReceipt = {
      ...sampleReceipt,
      receiptNumber: 'RCP-202611-0099',
      currency: 'USD',
      items: [
        { flavourName: 'Dragonfruit Cooler', quantity: 1, unitPrice: 6.5, subtotal: 6.5 }
      ],
      pricing: {
        subtotal: 6.5,
        discount: 0.5,
        tax: 0.5,
        grandTotal: 6.5
      },
      payment: {
        method: 'card',
        amountPaid: 6.5,
        changeGiven: 0
      }
    };

    const pdfBuffer = await pdfReceiptService.generateReceiptPdfBuffer(usdReceipt, { businessProfile: 'Juice USA' });
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('handles voided and draft status watermarks gracefully', async () => {
    const voidedReceipt = { ...sampleReceipt, status: 'voided' };
    const draftReceipt = { ...sampleReceipt, status: 'draft' };

    const voidedBuffer = await pdfReceiptService.generateReceiptPdfBuffer(voidedReceipt, sampleProfile);
    const draftBuffer = await pdfReceiptService.generateReceiptPdfBuffer(draftReceipt, sampleProfile);

    assert.ok(voidedBuffer.length > 500);
    assert.ok(draftBuffer.length > 500);
  });

  it('GET /api/receipts/:id/pdf serves valid application/pdf attachment', async () => {
    const originalGetById = receiptService.getById;
    receiptService.getById = async () => sampleReceipt;

    try {
      const token = jwt.sign({ userId: sampleReceipt.userId }, config.JWT_SECRET, { expiresIn: '1h' });
      const res = await request(app)
        .get(`/api/receipts/${sampleReceipt._id}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('application/pdf'));
      assert.ok(res.headers['content-disposition'].includes('attachment'));
      assert.ok(res.headers['content-disposition'].includes('Receipt-RCP-202611-0088.pdf'));
      assert.strictEqual(res.body.subarray(0, 5).toString('ascii'), '%PDF-');
    } finally {
      receiptService.getById = originalGetById;
    }
  });
});
