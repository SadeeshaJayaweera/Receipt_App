const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { config } = require('../src/config/env');
const Receipt = require('../src/models/Receipt');
const Flavour = require('../src/models/Flavour');
const receiptService = require('../src/services/receiptService');
const flavourService = require('../src/services/flavourService');

describe('Authorization and Business Data Isolation Tests', () => {
  const userA = '64f1a2b3c4d5e6f7a8b9c0d1';
  const userB = '64f1a2b3c4d5e6f7a8b9c0d2';

  const tokenUserB = jwt.sign(
    { userId: userB, jti: 'test-jti-user-b' },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );

  test('payload containing injected userId is rejected by strict validation', async () => {
    const res = await request(app)
      .post('/api/flavours')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({
        name: 'Hacked Orange Juice',
        price: 350,
        userId: userA // Attacker trying to inject another user's ID
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
    assert.ok(
      res.body.details.some(d => d.field === 'userId' || d.message.toLowerCase().includes('unrecognized'))
    );
  });

  test('receipt payload containing injected userId is rejected by strict validation', async () => {
    const res = await request(app)
      .post('/api/receipts')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({
        userId: userA, // Attacker trying to forge ownership
        items: [
          { flavourName: 'Papaya', quantity: 1, price: 200, subtotal: 200 }
        ],
        totalAmount: 200
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
  });

  test('receiptService rejects cross-user read when receipt belongs to another user', async () => {
    // Mock findOne to return null because query.userId (userB) != owner of document (userA)
    const mockFindOne = mock.method(Receipt, 'findOne', (query) => {
      assert.equal(query.userId, userB);
      return {
        populate: () => Promise.resolve(null)
      };
    });

    await assert.rejects(
      async () => {
        await receiptService.getById(userB, '64f1a2b3c4d5e6f7a8b9c999');
      },
      { name: 'NotFoundError', message: 'Receipt not found' }
    );

    mockFindOne.mock.restore();
  });

  test('receiptService rejects cross-user update attempt', async () => {
    const mockFindOne = mock.method(Receipt, 'findOne', async (query) => {
      assert.equal(query.userId, userB);
      return null;
    });

    await assert.rejects(
      async () => {
        await receiptService.update(userB, '64f1a2b3c4d5e6f7a8b9c999', { totalAmount: 0 });
      },
      { name: 'NotFoundError', message: 'Receipt not found' }
    );

    mockFindOne.mock.restore();
  });

  test('receiptService rejects cross-user delete attempt', async () => {
    const mockFindOne = mock.method(Receipt, 'findOne', async (query) => {
      assert.equal(query.userId, userB);
      return null;
    });

    await assert.rejects(
      async () => {
        await receiptService.delete(userB, '64f1a2b3c4d5e6f7a8b9c999');
      },
      { name: 'NotFoundError', message: 'Receipt not found' }
    );

    mockFindOne.mock.restore();
  });

  test('flavourService rejects cross-user update attempt', async () => {
    const mockFindOne = mock.method(Flavour, 'findOne', async (query) => {
      assert.equal(query.userId, userB);
      return null;
    });

    await assert.rejects(
      async () => {
        await flavourService.update(userB, '64f1a2b3c4d5e6f7a8b9c888', { price: 10 });
      },
      { name: 'NotFoundError', message: 'Flavour not found' }
    );

    mockFindOne.mock.restore();
  });

  test('flavourService rejects cross-user delete attempt', async () => {
    const mockFindOneAndUpdate = mock.method(Flavour, 'findOneAndUpdate', async (query) => {
      assert.equal(query.userId, userB);
      return null;
    });

    await assert.rejects(
      async () => {
        await flavourService.delete(userB, '64f1a2b3c4d5e6f7a8b9c888');
      },
      { name: 'NotFoundError', message: 'Flavour not found' }
    );

    mockFindOneAndUpdate.mock.restore();
  });
});
