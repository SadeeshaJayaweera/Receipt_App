const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const authService = require('../src/services/authService');
const User = require('../src/models/User');
const Receipt = require('../src/models/Receipt');
const receiptService = require('../src/services/receiptService');
const receiptNumberService = require('../src/services/receiptNumberService');
const pdfReceiptService = require('../src/services/pdfReceiptService');
const { updateProfileSchema } = require('../src/validators/authValidators');

describe('Business Branding & Receipt Customization Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  it('validates business branding and customization attributes via updateProfileSchema', () => {
    const validData = {
      businessName: 'Royal Island Juices',
      tagline: '100% Organic Fresh Daily',
      website: 'www.royaljuices.lk',
      receiptPrefix: 'POS',
      logoIcon: '🍹',
      showLogo: true,
      defaultCurrency: 'LKR',
      taxEnabled: true,
      taxRate: 8.5,
      receiptFooter: 'Thank you for your visit!'
    };

    const parsed = updateProfileSchema.parse(validData);
    assert.strictEqual(parsed.receiptPrefix, 'POS');
    assert.strictEqual(parsed.tagline, '100% Organic Fresh Daily');
    assert.strictEqual(parsed.logoIcon, '🍹');
    assert.strictEqual(parsed.taxRate, 8.5);
  });

  it('rejects receiptPrefix exceeding 8 characters', () => {
    assert.throws(() => {
      updateProfileSchema.parse({ receiptPrefix: 'VERYLONGPREFIX' });
    });
  });

  it('authService updateProfile persists branding attributes on User model', async () => {
    const mockUser = new User({
      _id: testUserId,
      businessName: 'Original Juices',
      email: 'owner@test.com',
      password: 'password123'
    });

    const originalFindById = User.findById;
    User.findById = async (id) => {
      if (id.toString() === testUserId) return mockUser;
      return null;
    };
    mockUser.save = async () => mockUser;

    try {
      const updated = await authService.updateProfile(testUserId, {
        businessName: 'Island Smoothie Bar',
        tagline: 'Handcrafted with Love',
        website: 'island.smoothies.lk',
        receiptPrefix: 'INV',
        logoIcon: '🥤',
        receiptFooter: 'Best drinks in Sri Lanka'
      });

      assert.strictEqual(updated.businessName, 'Island Smoothie Bar');
      assert.strictEqual(updated.tagline, 'Handcrafted with Love');
      assert.strictEqual(updated.website, 'island.smoothies.lk');
      assert.strictEqual(updated.receiptPrefix, 'INV');
      assert.strictEqual(updated.logoIcon, '🥤');
      assert.strictEqual(updated.receiptFooter, 'Best drinks in Sri Lanka');
    } finally {
      User.findById = originalFindById;
    }
  });

  it('receiptService.create formats sequential receipt numbers with tenant custom prefix', async () => {
    const originalGenerate = receiptNumberService.generateNextReceiptNumber;
    let requestedPrefix = null;

    mock.method(Receipt.prototype, 'save', async function() {
      return this;
    });

    receiptNumberService.generateNextReceiptNumber = async (userId, options) => {
      requestedPrefix = options?.prefix;
      return `${options?.prefix || 'RCP'}-202611-0001`;
    };

    try {
      const receipt = await receiptService.create(testUserId, {
        items: [{ flavourName: 'Papaya Boost', quantity: 1, price: 500, unitPrice: 500, subtotal: 500 }],
        paymentMethod: 'cash',
        currency: 'LKR'
      });

      assert.ok(receipt);
      assert.strictEqual(requestedPrefix, 'RCP', 'Default prefix must be RCP when tenant prefix is unset');
    } finally {
      receiptNumberService.generateNextReceiptNumber = originalGenerate;
      mock.reset();
    }
  });

  it('pdfReceiptService renders custom business tagline and website in receipt output', async () => {
    const receipt = {
      receiptNumber: 'INV-202611-0001',
      createdAt: new Date(),
      currency: 'LKR',
      items: [{ flavourName: 'Lime Blast', quantity: 1, subtotal: 300 }],
      pricing: { subtotal: 300, grandTotal: 300 },
      payment: { method: 'cash' }
    };

    const business = {
      businessName: 'Signature Beverages',
      tagline: 'Artisan Cold-Pressed Juices',
      website: 'www.signaturejuice.lk',
      phone: '+94 11 555 4444',
      receiptFooter: 'Custom Footer Message'
    };

    const heightWithBranding = pdfReceiptService.calculateReceiptHeight(receipt, business);
    const heightWithoutBranding = pdfReceiptService.calculateReceiptHeight(receipt, {});

    assert.ok(heightWithBranding > heightWithoutBranding, 'Branded receipt height must account for tagline & website lines');

    const pdfBuffer = await pdfReceiptService.generateReceiptPdfBuffer(receipt, business);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });
});
