const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Receipt = require('../src/models/Receipt');
const receiptService = require('../src/services/receiptService');

describe('Receipt History & Advanced Search Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  test('returns structured pagination metadata with calculated totalPages and flags', async () => {
    const mockReceipts = [
      { receiptNumber: 'RCP-202611-0001', totalAmount: 500 },
      { receiptNumber: 'RCP-202611-0002', totalAmount: 750 }
    ];

    mock.method(Receipt, 'countDocuments', async (filter) => {
      assert.equal(filter.userId, testUserId);
      return 45; // Total 45 receipts
    });

    mock.method(Receipt, 'find', (filter) => {
      assert.equal(filter.userId, testUserId);
      return {
        populate: () => ({
          sort: () => ({
            skip: (skip) => {
              assert.equal(skip, 20); // (page 2 - 1) * 20 = 20
              return {
                limit: (limit) => {
                  assert.equal(limit, 20);
                  return Promise.resolve(mockReceipts);
                }
              };
            }
          })
        })
      };
    });

    const result = await receiptService.getAll(testUserId, { page: 2, limit: 20 });

    assert.ok(result.receipts);
    assert.equal(result.receipts.length, 2);
    assert.deepEqual(result.pagination, {
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3, // Math.ceil(45 / 20)
      hasNextPage: true, // page 2 < 3
      hasPrevPage: true  // page 2 > 1
    });

    mock.reset();
  });

  test('applies sorting by totalAmount in ascending and descending order', async () => {
    const appliedSorts = [];

    mock.method(Receipt, 'countDocuments', async () => 10);
    mock.method(Receipt, 'find', () => ({
      populate: () => ({
        sort: (criteria) => {
          appliedSorts.push(criteria);
          return {
            skip: () => ({
              limit: () => Promise.resolve([])
            })
          };
        }
      })
    }));

    await receiptService.getAll(testUserId, { sortBy: 'totalAmount', sortOrder: 'asc' });
    assert.deepEqual(appliedSorts[0], { totalAmount: 1 });

    await receiptService.getAll(testUserId, { sortBy: 'totalAmount', sortOrder: 'desc' });
    assert.deepEqual(appliedSorts[1], { totalAmount: -1 });

    mock.reset();
  });

  test('applies date range filtering with startDate and endDate', async () => {
    let capturedFilter = null;

    mock.method(Receipt, 'countDocuments', async () => 5);
    mock.method(Receipt, 'find', (filter) => {
      capturedFilter = filter;
      return {
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([])
            })
          })
        })
      };
    });

    await receiptService.getAll(testUserId, {
      startDate: '2026-11-01',
      endDate: '2026-11-15'
    });

    assert.ok(capturedFilter.createdAt);
    assert.ok(capturedFilter.createdAt.$gte instanceof Date);
    assert.ok(capturedFilter.createdAt.$lte instanceof Date);
    assert.equal(capturedFilter.userId, testUserId);

    mock.reset();
  });

  test('filters receipts by status, currency, and payment method', async () => {
    let capturedFilter = null;

    mock.method(Receipt, 'countDocuments', async () => 3);
    mock.method(Receipt, 'find', (filter) => {
      capturedFilter = filter;
      return {
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([])
            })
          })
        })
      };
    });

    await receiptService.getAll(testUserId, {
      status: 'issued',
      currency: 'USD',
      paymentMethod: 'card'
    });

    assert.equal(capturedFilter.status, 'issued');
    assert.equal(capturedFilter.currency, 'USD');
    assert.ok(capturedFilter.$or); // payment.method or paymentMethod

    mock.reset();
  });

  test('filters receipts by minimum and maximum total amount bounds', async () => {
    let capturedFilter = null;

    mock.method(Receipt, 'countDocuments', async () => 2);
    mock.method(Receipt, 'find', (filter) => {
      capturedFilter = filter;
      return {
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([])
            })
          })
        })
      };
    });

    await receiptService.getAll(testUserId, {
      minAmount: 500,
      maxAmount: 2000
    });

    assert.ok(capturedFilter.totalAmount);
    assert.equal(capturedFilter.totalAmount.$gte, 500);
    assert.equal(capturedFilter.totalAmount.$lte, 2000);

    mock.reset();
  });

  test('executes multi-field full text search across receipt number, customer, and items', async () => {
    let capturedFilter = null;

    mock.method(Receipt, 'countDocuments', async () => 1);
    mock.method(Receipt, 'find', (filter) => {
      capturedFilter = filter;
      return {
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([])
            })
          })
        })
      };
    });

    await receiptService.getAll(testUserId, { search: 'Avocado' });

    assert.ok(capturedFilter.$or);
    assert.ok(capturedFilter.$or.some(c => c['items.flavourName']));
    assert.ok(capturedFilter.$or.some(c => c.receiptNumber));
    assert.ok(capturedFilter.$or.some(c => c['customer.name']));

    mock.reset();
  });
});
