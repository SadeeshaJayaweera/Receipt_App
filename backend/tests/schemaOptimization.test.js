const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Flavour = require('../src/models/Flavour');
const Receipt = require('../src/models/Receipt');

describe('Schema Optimization & Model Validation Tests', () => {
  describe('User Model Schema & Index Tests', () => {
    test('defines unique email index', () => {
      const indexes = User.schema.indexes();
      const emailIndex = indexes.find(([spec]) => spec.email === 1);
      assert.ok(emailIndex, 'Unique email index must exist on User schema');
      assert.equal(emailIndex[1].unique, true);
    });

    test('validates user defaults and bounds', () => {
      const validUser = new User({
        businessName: 'Fresh Squeeze Juice Bar',
        email: 'Owner@Example.COM',
        password: 'securepassword123'
      });

      assert.equal(validUser.defaultCurrency, 'LKR');
      assert.equal(validUser.taxEnabled, false);
      assert.equal(validUser.taxRate, 0);
      assert.equal(validUser.receiptFooter, 'Thank you for your business!');
      assert.equal(validUser.email, 'owner@example.com'); // Lowercased

      const invalidEmailUser = new User({
        businessName: 'Valid Name',
        email: 'invalid-email',
        password: 'pass'
      });
      const err = invalidEmailUser.validateSync();
      assert.ok(err.errors.email, 'Should reject invalid email format');
      assert.ok(err.errors.password, 'Should reject password shorter than 6 characters');
    });
  });

  describe('Flavour Model Schema & Index Tests', () => {
    test('defines compound indexes for tenant isolation and uniqueness', () => {
      const indexes = Flavour.schema.indexes();
      const uniqueNamePerUser = indexes.find(([spec]) => spec.userId === 1 && spec.name === 1);
      assert.ok(uniqueNamePerUser, 'Compound unique index { userId: 1, name: 1 } must exist');
      assert.equal(uniqueNamePerUser[1].unique, true);

      const activePerUser = indexes.find(([spec]) => spec.userId === 1 && spec.isActive === 1);
      assert.ok(activePerUser, 'Compound index { userId: 1, isActive: 1 } must exist');
    });

    test('rejects negative flavour price and empty name', () => {
      const flavour = new Flavour({
        userId: new mongoose.Types.ObjectId(),
        name: '',
        price: -10
      });

      const err = flavour.validateSync();
      assert.ok(err.errors.name, 'Empty name should fail validation');
      assert.ok(err.errors.price, 'Negative price should fail validation');
    });
  });

  describe('Receipt Model Schema & Index Tests', () => {
    test('defines required compound indexes for tenant queries and sequential numbers', () => {
      const indexes = Receipt.schema.indexes();
      
      const userDateIndex = indexes.find(([spec]) => spec.userId === 1 && spec.createdAt === -1);
      assert.ok(userDateIndex, 'Index { userId: 1, createdAt: -1 } must exist');

      const userReceiptNoIndex = indexes.find(([spec]) => spec.userId === 1 && spec.receiptNumber === 1);
      assert.ok(userReceiptNoIndex, 'Index { userId: 1, receiptNumber: 1 } must exist');
      assert.equal(userReceiptNoIndex[1].unique, true);

      const userCurrencyStatusIndex = indexes.find(([spec]) => spec.userId === 1 && spec.currency === 1 && spec.status === 1);
      assert.ok(userCurrencyStatusIndex, 'Index { userId: 1, currency: 1, status: 1 } must exist');
    });

    test('validates supported currencies and statuses', () => {
      const validReceipt = new Receipt({
        userId: new mongoose.Types.ObjectId(),
        receiptNumber: 'RCP-001',
        currency: 'USD',
        status: 'issued',
        items: [{
          flavourName: 'Avocado Shake',
          quantity: 2,
          price: 5.5,
          subtotal: 11
        }],
        subtotal: 11,
        totalAmount: 11
      });

      const err = validReceipt.validateSync();
      assert.equal(err, undefined, 'Valid receipt should pass validation');

      const invalidReceipt = new Receipt({
        userId: new mongoose.Types.ObjectId(),
        currency: 'EUR', // Unsupported
        status: 'pending_payment', // Invalid status
        items: []
      });

      const invalidErr = invalidReceipt.validateSync();
      assert.ok(invalidErr.errors.currency, 'EUR should be rejected');
      assert.ok(invalidErr.errors.status, 'Invalid status should be rejected');
      assert.ok(invalidErr.errors.items, 'Empty items should be rejected');
    });

    test('validates line item structure (positive integer quantity, non-negative subtotal)', () => {
      const receipt = new Receipt({
        userId: new mongoose.Types.ObjectId(),
        receiptNumber: 'RCP-002',
        currency: 'LKR',
        items: [{
          flavourName: 'Mango Juice',
          quantity: 1.5, // Not integer
          price: -100, // Negative
          subtotal: -150
        }],
        subtotal: -150,
        totalAmount: -150
      });

      const err = receipt.validateSync();
      assert.ok(err.errors['items.0.quantity'], 'Non-integer quantity must fail');
      assert.ok(err.errors['items.0.price'], 'Negative price must fail');
      assert.ok(err.errors['items.0.subtotal'], 'Negative subtotal must fail');
    });
  });
});
