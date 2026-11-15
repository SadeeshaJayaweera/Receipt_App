const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Receipt = require('../src/models/Receipt');
const receiptService = require('../src/services/receiptService');

describe('Receipt Lifecycle & Immutability Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  describe('Draft to Issued Lifecycle', () => {
    test('transitions draft receipt to issued and appends to statusHistory', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        receiptNumber: 'RCP-202611-0001',
        status: 'draft',
        statusHistory: [{
          fromStatus: 'none',
          toStatus: 'draft',
          changedAt: new Date(),
          reason: 'Initial creation',
          changedBy: testUserId
        }],
        save: async function() { return this; }
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      const issuedReceipt = await receiptService.issueDraft(testUserId, mockReceipt._id);
      assert.equal(issuedReceipt.status, 'issued');
      assert.equal(issuedReceipt.statusHistory.length, 2);
      assert.equal(issuedReceipt.statusHistory[1].fromStatus, 'draft');
      assert.equal(issuedReceipt.statusHistory[1].toStatus, 'issued');

      mock.reset();
    });
  });

  describe('Issued Receipt Financial Immutability', () => {
    test('rejects item or pricing modifications on issued receipt', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        receiptNumber: 'RCP-202611-0002',
        status: 'issued',
        items: [{ flavourName: 'Apple Juice', quantity: 1, price: 300, subtotal: 300 }],
        subtotal: 300,
        totalAmount: 300
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      // Attempt to modify items
      await assert.rejects(
        async () => receiptService.update(testUserId, mockReceipt._id, {
          items: [{ flavourName: 'Apple Juice', quantity: 2, price: 300 }]
        }),
        /financially immutable/
      );

      // Attempt to modify discount
      await assert.rejects(
        async () => receiptService.update(testUserId, mockReceipt._id, {
          discount: 50
        }),
        /financially immutable/
      );

      mock.reset();
    });

    test('rejects direct deletion of issued receipts to protect audit compliance', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        receiptNumber: 'RCP-202611-0003',
        status: 'issued'
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      await assert.rejects(
        async () => receiptService.delete(testUserId, mockReceipt._id),
        /Issued receipts cannot be deleted for audit compliance/
      );

      mock.reset();
    });
  });

  describe('Receipt Voiding & Audit Trail', () => {
    test('successfully voids issued receipt with mandatory reason and timestamp', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        receiptNumber: 'RCP-202611-0004',
        status: 'issued',
        statusHistory: [{ fromStatus: 'none', toStatus: 'issued' }],
        save: async function() { return this; }
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      const voided = await receiptService.voidReceipt(
        testUserId,
        mockReceipt._id,
        'Customer changed mind and cancelled order'
      );

      assert.equal(voided.status, 'voided');
      assert.ok(voided.voidedAt instanceof Date);
      assert.equal(voided.voidReason, 'Customer changed mind and cancelled order');
      assert.equal(voided.voidedBy, testUserId);
      assert.equal(voided.statusHistory.length, 2);
      assert.equal(voided.statusHistory[1].toStatus, 'voided');

      mock.reset();
    });

    test('rejects voiding with empty or short reason', async () => {
      await assert.rejects(
        async () => receiptService.voidReceipt(testUserId, 'some-id', 'no'),
        /valid void reason/
      );
    });

    test('rejects voiding an already voided receipt', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        receiptNumber: 'RCP-202611-0005',
        status: 'voided'
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      await assert.rejects(
        async () => receiptService.voidReceipt(testUserId, mockReceipt._id, 'Double void test reason'),
        /already voided/
      );

      mock.reset();
    });

    test('rejects any modifications on voided receipt', async () => {
      const mockReceipt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        status: 'voided'
      };

      mock.method(Receipt, 'findOne', async () => mockReceipt);

      await assert.rejects(
        async () => receiptService.update(testUserId, mockReceipt._id, { notes: 'Updated note' }),
        /Cannot modify a voided receipt/
      );

      mock.reset();
    });
  });
});
