const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  round,
  toMinorUnits,
  fromMinorUnits,
  calculateLineItem,
  calculateReceiptTotals,
  calculateChange,
  formatCurrency
} = require('../src/utils/calcEngine');

describe('Authoritative Decimal Calculation Engine Tests', () => {
  describe('Floating Point & Minor Unit Conversions', () => {
    test('avoids JavaScript floating point drift (0.1 + 0.2 = 0.3)', () => {
      const sum = 0.1 + 0.2;
      assert.notEqual(sum, 0.3); // Raw JS fails
      assert.equal(round(sum, 2), 0.3); // Calc engine fixes
      assert.equal(round(1.005, 2), 1.01);
    });

    test('accurately converts to and from minor units (cents / cents equivalents)', () => {
      assert.equal(toMinorUnits(12.50), 1250);
      assert.equal(toMinorUnits(0.05), 5);
      assert.equal(fromMinorUnits(1250), 12.50);
      assert.equal(fromMinorUnits(5), 0.05);
    });
  });

  describe('Line Item Calculation', () => {
    test('calculates line item subtotal correctly', () => {
      const item = calculateLineItem({
        flavourName: 'Pineapple Juice',
        quantity: 3,
        price: 250.50
      });

      assert.equal(item.quantity, 3);
      assert.equal(item.price, 250.50);
      assert.equal(item.subtotal, 751.50);
    });

    test('handles zero and invalid inputs safely', () => {
      const item = calculateLineItem({
        flavourName: '',
        quantity: -5,
        price: -10
      });

      assert.equal(item.quantity, 0);
      assert.equal(item.price, 0);
      assert.equal(item.subtotal, 0);
    });
  });

  describe('Receipt Totals Computation', () => {
    const sampleItems = [
      { flavourName: 'Mango', quantity: 2, price: 300 }, // 600
      { flavourName: 'Orange', quantity: 1, price: 250 }  // 250
    ]; // Subtotal = 850

    test('computes subtotal with tax off by default and zero discount', () => {
      const totals = calculateReceiptTotals({ items: sampleItems, currency: 'LKR' });

      assert.equal(totals.subtotal, 850);
      assert.equal(totals.discount, 0);
      assert.equal(totals.taxEnabled, false);
      assert.equal(totals.taxRate, 0);
      assert.equal(totals.taxAmount, 0);
      assert.equal(totals.totalAmount, 850);
      assert.equal(totals.currency, 'LKR');
    });

    test('computes fixed discount correctly and caps discount at subtotal', () => {
      const normalDiscount = calculateReceiptTotals({
        items: sampleItems,
        discount: 100,
        discountType: 'fixed'
      });
      assert.equal(normalDiscount.subtotal, 850);
      assert.equal(normalDiscount.discount, 100);
      assert.equal(normalDiscount.totalAmount, 750);

      // Capped discount exceeding subtotal
      const excessiveDiscount = calculateReceiptTotals({
        items: sampleItems,
        discount: 1200,
        discountType: 'fixed'
      });
      assert.equal(excessiveDiscount.subtotal, 850);
      assert.equal(excessiveDiscount.discount, 850); // Capped at subtotal
      assert.equal(excessiveDiscount.totalAmount, 0); // No negative totals
    });

    test('computes percentage discount correctly', () => {
      const percentDiscount = calculateReceiptTotals({
        items: sampleItems,
        discountValue: 10,
        discountType: 'percent'
      });

      // 10% of 850 = 85
      assert.equal(percentDiscount.subtotal, 850);
      assert.equal(percentDiscount.discount, 85);
      assert.equal(percentDiscount.totalAmount, 765);
    });

    test('computes configurable tax when tax is enabled', () => {
      const withTax = calculateReceiptTotals({
        items: sampleItems,
        discount: 50, // Subtotal 850 - 50 = 800 taxable
        taxEnabled: true,
        taxRate: 15 // 15% of 800 = 120
      });

      assert.equal(withTax.subtotal, 850);
      assert.equal(withTax.discount, 50);
      assert.equal(withTax.taxableAmount, 800);
      assert.equal(withTax.taxEnabled, true);
      assert.equal(withTax.taxRate, 15);
      assert.equal(withTax.taxAmount, 120);
      assert.equal(withTax.totalAmount, 920); // 800 + 120
    });
  });

  describe('Cash Change & Balance Calculation', () => {
    test('calculates correct change on sufficient cash', () => {
      const res = calculateChange(750, 1000);
      assert.equal(res.isSufficient, true);
      assert.equal(res.change, 250);
      assert.equal(res.shortfall, 0);
    });

    test('detects shortfall on insufficient cash', () => {
      const res = calculateChange(750, 500);
      assert.equal(res.isSufficient, false);
      assert.equal(res.change, 0);
      assert.equal(res.shortfall, 250);
    });
  });

  describe('Currency Formatting', () => {
    test('formats LKR currency with Rs. prefix and commas', () => {
      assert.equal(formatCurrency(1250, 'LKR'), 'Rs. 1,250.00');
      assert.equal(formatCurrency(50.5, 'LKR'), 'Rs. 50.50');
    });

    test('formats USD currency with $ prefix and commas', () => {
      assert.equal(formatCurrency(12.5, 'USD'), '$12.50');
      assert.equal(formatCurrency(1450.99, 'USD'), '$1,450.99');
    });
  });
});
