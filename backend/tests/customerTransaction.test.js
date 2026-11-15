const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Receipt = require('../src/models/Receipt');
const receiptService = require('../src/services/receiptService');
const receiptNumberService = require('../src/services/receiptNumberService');

describe('Customer & Transaction Information Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  test('creates receipt with structured customer information and syncs flat fields', async () => {
    mock.method(receiptNumberService, 'generateNextReceiptNumber', async () => 'RCP-202611-0001');

    let savedDoc = null;
    mock.method(Receipt.prototype, 'save', async function() {
      savedDoc = this;
      return this;
    });

    await receiptService.create(testUserId, {
      items: [{ flavourName: 'Avocado Shake', quantity: 2, price: 300 }],
      customer: {
        name: 'Kasun Perera',
        phone: '+94771234567',
        email: 'KASUN@GMAIL.COM',
        loyaltyNumber: 'LOYAL-99',
        notes: 'Regular customer'
      },
      payment: {
        method: 'card',
        reference: 'TXN-VISA-98765'
      }
    });

    assert.ok(savedDoc);
    assert.equal(savedDoc.customer.name, 'Kasun Perera');
    assert.equal(savedDoc.customerName, 'Kasun Perera'); // Synced flat field
    assert.equal(savedDoc.customer.phone, '+94771234567');
    assert.equal(savedDoc.customerPhone, '+94771234567');
    assert.equal(savedDoc.customer.email, 'kasun@gmail.com');
    assert.equal(savedDoc.customer.loyaltyNumber, 'LOYAL-99');
    assert.equal(savedDoc.payment.method, 'card');
    assert.equal(savedDoc.payment.reference, 'TXN-VISA-98765');

    mock.reset();
  });

  test('creates receipt anonymously for walk-in customers without errors', async () => {
    mock.method(receiptNumberService, 'generateNextReceiptNumber', async () => 'RCP-202611-0002');

    let savedDoc = null;
    mock.method(Receipt.prototype, 'save', async function() {
      savedDoc = this;
      return this;
    });

    await receiptService.create(testUserId, {
      items: [{ flavourName: 'Lime Juice', quantity: 1, price: 150 }]
    });

    assert.ok(savedDoc);
    assert.equal(savedDoc.customer.name, '');
    assert.equal(savedDoc.customerName, '');
    assert.equal(savedDoc.payment.method, 'cash');

    mock.reset();
  });

  test('automatically calculates and stores cash change given on cash transactions', async () => {
    mock.method(receiptNumberService, 'generateNextReceiptNumber', async () => 'RCP-202611-0003');

    let savedDoc = null;
    mock.method(Receipt.prototype, 'save', async function() {
      savedDoc = this;
      return this;
    });

    await receiptService.create(testUserId, {
      items: [{ flavourName: 'Papaya Juice', quantity: 3, price: 250 }], // Total = 750
      payment: {
        method: 'cash',
        cashReceived: 1000
      }
    });

    assert.ok(savedDoc);
    assert.equal(savedDoc.totalAmount, 750);
    assert.equal(savedDoc.payment.cashReceived, 1000);
    assert.equal(savedDoc.payment.changeGiven, 250); // 1000 - 750 = 250

    mock.reset();
  });

  test('filters receipts by customer phone and customer name in queries', async () => {
    const capturedQueries = [];
    mock.method(Receipt, 'find', (filter) => {
      capturedQueries.push(filter);
      return {
        populate: () => ({
          sort: () => [{ receiptNumber: 'RCP-001' }]
        })
      };
    });

    // Query by customer phone
    await receiptService.getAll(testUserId, { customerPhone: '0771234567' });
    assert.ok(capturedQueries[0].$or);
    assert.equal(capturedQueries[0].userId, testUserId);

    // Query by search keyword
    await receiptService.getAll(testUserId, { search: 'Kasun' });
    assert.ok(capturedQueries[1].$or);

    mock.reset();
  });
});
