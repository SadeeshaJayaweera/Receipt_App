const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const ReceiptCounter = require('../src/models/ReceiptCounter');
const receiptNumberService = require('../src/services/receiptNumberService');

describe('Financial Data Integrity & Receipt Numbering Tests', () => {
  const tenantA = new mongoose.Types.ObjectId().toString();
  const tenantB = new mongoose.Types.ObjectId().toString();
  const fixedDate = new Date(2026, 10, 15); // Month is 0-indexed: 10 = November 2026 -> '202611'

  describe('ReceiptCounter Model & Index Tests', () => {
    test('defines unique compound index on userId, prefix, and period', () => {
      const indexes = ReceiptCounter.schema.indexes();
      const uniqueCounterIndex = indexes.find(
        ([spec]) => spec.userId === 1 && spec.prefix === 1 && spec.period === 1
      );
      assert.ok(uniqueCounterIndex, 'Unique index { userId: 1, prefix: 1, period: 1 } must exist');
      assert.equal(uniqueCounterIndex[1].unique, true);
    });

    test('validates period format YYYYMM and non-negative seq', () => {
      const validCounter = new ReceiptCounter({
        userId: new mongoose.Types.ObjectId(),
        prefix: 'rcp',
        period: '202611',
        seq: 5
      });
      assert.equal(validCounter.prefix, 'RCP', 'Prefix should be uppercased');
      assert.equal(validCounter.validateSync(), undefined);

      const invalidCounter = new ReceiptCounter({
        userId: new mongoose.Types.ObjectId(),
        period: 'invalid-period',
        seq: -1
      });
      const err = invalidCounter.validateSync();
      assert.ok(err.errors.period, 'Invalid period string should fail validation');
      assert.ok(err.errors.seq, 'Negative seq should fail validation');
    });
  });

  describe('ReceiptNumberService Atomic Generator Tests', () => {
    test('generates formatted sequential number with zero-padded sequence', async () => {
      let currentSeq = 0;
      mock.method(ReceiptCounter, 'findOneAndUpdate', async (filter, update) => {
        currentSeq += update.$inc.seq;
        return {
          userId: filter.userId,
          prefix: filter.prefix,
          period: filter.period,
          seq: currentSeq
        };
      });

      const num1 = await receiptNumberService.generateNextReceiptNumber(tenantA, { date: fixedDate });
      assert.equal(num1, 'RCP-202611-0001');

      const num2 = await receiptNumberService.generateNextReceiptNumber(tenantA, { date: fixedDate });
      assert.equal(num2, 'RCP-202611-0002');

      mock.reset();
    });

    test('maintains multi-tenant isolation across businesses', async () => {
      const tenantCounters = new Map();

      mock.method(ReceiptCounter, 'findOneAndUpdate', async (filter, update) => {
        const key = `${filter.userId}:${filter.prefix}:${filter.period}`;
        const prev = tenantCounters.get(key) || 0;
        const next = prev + update.$inc.seq;
        tenantCounters.set(key, next);
        return {
          userId: filter.userId,
          prefix: filter.prefix,
          period: filter.period,
          seq: next
        };
      });

      const tenantA_1 = await receiptNumberService.generateNextReceiptNumber(tenantA, { date: fixedDate });
      const tenantB_1 = await receiptNumberService.generateNextReceiptNumber(tenantB, { date: fixedDate });
      const tenantA_2 = await receiptNumberService.generateNextReceiptNumber(tenantA, { date: fixedDate });

      assert.equal(tenantA_1, 'RCP-202611-0001');
      assert.equal(tenantB_1, 'RCP-202611-0001');
      assert.equal(tenantA_2, 'RCP-202611-0002');

      mock.reset();
    });

    test('supports custom prefix and custom padding', async () => {
      mock.method(ReceiptCounter, 'findOneAndUpdate', async (filter) => ({
        userId: filter.userId,
        prefix: filter.prefix,
        period: filter.period,
        seq: 42
      }));

      const num = await receiptNumberService.generateNextReceiptNumber(tenantA, {
        prefix: 'INV',
        date: fixedDate,
        padding: 6
      });
      assert.equal(num, 'INV-202611-000042');

      mock.reset();
    });

    test('fails safely when userId is missing', async () => {
      await assert.rejects(
        async () => receiptNumberService.generateNextReceiptNumber(null),
        /UserId is required/
      );
    });

    test('getCurrentSequence peeks sequence without incrementing', async () => {
      mock.method(ReceiptCounter, 'findOne', async () => ({ seq: 15 }));

      const current = await receiptNumberService.getCurrentSequence(tenantA, 'RCP', '202611');
      assert.equal(current, 15);

      mock.reset();
    });
  });
});
