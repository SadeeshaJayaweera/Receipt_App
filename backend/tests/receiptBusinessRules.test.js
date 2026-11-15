const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const receiptValidationService = require('../src/services/receiptValidationService');

describe('Receipt Business Rules Validation Tests', () => {
  describe('Line Item Validation and Duplicate Normalization', () => {
    test('merges duplicate line items for the same flavour and price', () => {
      const rawItems = [
        { flavourName: 'Papaya Juice', quantity: 2, price: 200 },
        { flavourName: 'Lime Juice', quantity: 1, price: 150 },
        { flavourName: 'papaya juice', quantity: 3, price: 200 } // Duplicate with case difference
      ];

      const normalized = receiptValidationService.validateAndNormalizeItems(rawItems);
      assert.equal(normalized.length, 2, 'Duplicates should be merged into 2 distinct items');

      const papaya = normalized.find(i => i.flavourName.toLowerCase() === 'papaya juice');
      assert.ok(papaya);
      assert.equal(papaya.quantity, 5); // 2 + 3
      assert.equal(papaya.subtotal, 1000); // 5 * 200
    });

    test('rejects items when quantity is non-positive or exceeds maximum limit', () => {
      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([
          { flavourName: 'Orange', quantity: 0, price: 250 }
        ]),
        /must have a positive integer quantity/
      );

      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([
          { flavourName: 'Orange', quantity: 1001, price: 250 }
        ]),
        /cannot exceed 1000/
      );
    });

    test('rejects negative price and prices exceeding maximum limit', () => {
      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([
          { flavourName: 'Orange', quantity: 1, price: -50 }
        ]),
        /cannot be negative/
      );

      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([
          { flavourName: 'Orange', quantity: 1, price: 1000001 }
        ]),
        /cannot exceed 1000000/
      );
    });

    test('rejects empty line items array or missing flavour name', () => {
      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([]),
        /must contain at least one line item/
      );

      assert.throws(
        () => receiptValidationService.validateAndNormalizeItems([
          { flavourName: '   ', quantity: 1, price: 100 }
        ]),
        /missing a flavour name/
      );
    });
  });

  describe('Discount Rules Validation', () => {
    test('rejects fixed discount exceeding subtotal', () => {
      assert.throws(
        () => receiptValidationService.validateDiscount(500, 'fixed', 400),
        /cannot exceed order subtotal/
      );
    });

    test('rejects percentage discount greater than 100%', () => {
      assert.throws(
        () => receiptValidationService.validateDiscount(110, 'percent', 1000),
        /cannot exceed 100%/
      );
    });

    test('rejects negative discounts', () => {
      assert.throws(
        () => receiptValidationService.validateDiscount(-20, 'fixed', 500),
        /cannot be negative/
      );
    });

    test('accepts valid fixed and percentage discounts', () => {
      assert.doesNotThrow(() => receiptValidationService.validateDiscount(50, 'fixed', 500));
      assert.doesNotThrow(() => receiptValidationService.validateDiscount(15, 'percent', 500));
    });
  });

  describe('Tax Configuration Rules Validation', () => {
    test('rejects tax rate exceeding 100% or negative tax rate when enabled', () => {
      assert.throws(
        () => receiptValidationService.validateTax(true, 105),
        /Tax rate must be between 0% and 100%/
      );

      assert.throws(
        () => receiptValidationService.validateTax(true, -5),
        /Tax rate must be between 0% and 100%/
      );
    });

    test('accepts valid tax rates and ignores tax rate if disabled', () => {
      assert.doesNotThrow(() => receiptValidationService.validateTax(true, 15));
      assert.doesNotThrow(() => receiptValidationService.validateTax(false, 0));
    });
  });

  describe('Payment Rules & Financial Bounds', () => {
    test('rejects unsupported payment method', () => {
      assert.throws(
        () => receiptValidationService.validatePayment('crypto', 500),
        /Invalid payment method "crypto"/
      );
    });

    test('rejects insufficient cash payment', () => {
      assert.throws(
        () => receiptValidationService.validatePayment('cash', 1000, 800),
        /insufficient for total amount/
      );
    });

    test('accepts sufficient cash and card payments', () => {
      assert.doesNotThrow(() => receiptValidationService.validatePayment('cash', 1000, 1000));
      assert.doesNotThrow(() => receiptValidationService.validatePayment('cash', 1000, 1500));
      assert.doesNotThrow(() => receiptValidationService.validatePayment('card', 1000));
      assert.doesNotThrow(() => receiptValidationService.validatePayment('mobile', 1000));
    });

    test('rejects excessive order amounts exceeding 50,000,000', () => {
      assert.throws(
        () => receiptValidationService.validateFinancialBounds(50000001, 50000001),
        /cannot exceed 50000000/
      );
    });
  });
});
