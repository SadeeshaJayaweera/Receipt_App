const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const {
  formatCurrency,
  isValidCurrency,
  getCurrencySymbol,
  assertSameCurrency,
  SUPPORTED_CURRENCIES
} = require('../src/utils/calcEngine');
const User = require('../src/models/User');
const Receipt = require('../src/models/Receipt');
const authService = require('../src/services/authService');
const receiptService = require('../src/services/receiptService');
const receiptNumberService = require('../src/services/receiptNumberService');

describe('Multi-Currency & Regional Formatting Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  describe('Currency Engine Utilities & Formatting', () => {
    test('defines supported currencies LKR and USD', () => {
      assert.deepEqual(SUPPORTED_CURRENCIES, ['LKR', 'USD']);
      assert.equal(isValidCurrency('LKR'), true);
      assert.equal(isValidCurrency('lkr'), true);
      assert.equal(isValidCurrency('USD'), true);
      assert.equal(isValidCurrency('EUR'), false);
      assert.equal(isValidCurrency(''), false);
    });

    test('returns accurate currency symbols', () => {
      assert.equal(getCurrencySymbol('LKR'), 'Rs.');
      assert.equal(getCurrencySymbol('USD'), '$');
    });

    test('formats currency with symbol, code, and combined formats', () => {
      // Default symbol format
      assert.equal(formatCurrency(1250, 'LKR'), 'Rs. 1,250.00');
      assert.equal(formatCurrency(12.5, 'USD'), '$12.50');

      // Code format
      assert.equal(formatCurrency(1250, 'LKR', { format: 'code' }), 'LKR 1,250.00');
      assert.equal(formatCurrency(12.5, 'USD', { format: 'code' }), 'USD 12.50');

      // Both format
      assert.equal(formatCurrency(1250, 'LKR', { format: 'both' }), 'LKR Rs. 1,250.00');
      assert.equal(formatCurrency(12.5, 'USD', { format: 'both' }), 'USD $12.50');
    });

    test('prevents arithmetic across different currencies without conversion', () => {
      assert.doesNotThrow(() => assertSameCurrency('LKR', 'LKR'));
      assert.doesNotThrow(() => assertSameCurrency('usd', 'USD'));
      assert.throws(
        () => assertSameCurrency('LKR', 'USD'),
        /Cannot perform financial calculation across different currencies/
      );
    });
  });

  describe('Business Profile Currency Settings', () => {
    test('updates defaultCurrency, tax settings, and receipt footer', async () => {
      const mockUser = {
        _id: testUserId,
        businessName: 'Global Fresh Juice',
        email: 'global@juice.com',
        phone: '0770000000',
        address: 'Colombo',
        defaultCurrency: 'LKR',
        taxEnabled: false,
        taxRate: 0,
        receiptFooter: 'Thank you!',
        save: async function() { return this; }
      };

      mock.method(User, 'findById', async () => mockUser);

      const updated = await authService.updateProfile(testUserId, {
        defaultCurrency: 'USD',
        taxEnabled: true,
        taxRate: 8,
        receiptFooter: 'Have a great day!'
      });

      assert.equal(updated.defaultCurrency, 'USD');
      assert.equal(updated.taxEnabled, true);
      assert.equal(updated.taxRate, 8);
      assert.equal(updated.receiptFooter, 'Have a great day!');

      mock.reset();
    });

    test('rejects unsupported currency in profile update', async () => {
      const mockUser = {
        _id: testUserId,
        save: async function() { return this; }
      };
      mock.method(User, 'findById', async () => mockUser);

      await assert.rejects(
        async () => authService.updateProfile(testUserId, { defaultCurrency: 'EUR' }),
        /Invalid currency. Supported currencies: LKR, USD/
      );

      mock.reset();
    });
  });

  describe('Receipt Currency Inheritance', () => {
    test('inherits business defaultCurrency when receipt currency is omitted', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      mock.method(User, 'findById', () => ({
        select: () => Promise.resolve({ defaultCurrency: 'USD' })
      }));
      mock.method(receiptNumberService, 'generateNextReceiptNumber', async () => 'RCP-202611-0001');

      let savedDoc = null;
      mock.method(Receipt.prototype, 'save', async function() {
        savedDoc = this;
        return this;
      });

      await receiptService.create(testUserId, {
        items: [{ flavourName: 'Papaya Shake', quantity: 1, price: 5.50 }]
        // currency omitted
      });

      assert.ok(savedDoc);
      assert.equal(savedDoc.currency, 'USD');

      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
      mock.reset();
    });
  });
});
