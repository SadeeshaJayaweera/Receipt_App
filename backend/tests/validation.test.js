const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { config } = require('../src/config/env');

describe('API Request Validation & Standardized Errors', () => {
  const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const authToken = jwt.sign({ userId: testUserId }, config.JWT_SECRET, { expiresIn: '1h' });

  test('every response contains X-Request-Id header', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.ok(res.headers['x-request-id']);
  });

  test('POST /api/auth/register returns 400 with structured field errors on invalid email and short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'J',
        email: 'invalid-email-address',
        password: '123'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
    assert.ok(res.body.requestId);
    assert.ok(res.body.timestamp);

    const fields = res.body.details.map(d => d.field);
    assert.ok(fields.includes('businessName'));
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  test('POST /api/auth/login returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
    assert.ok(res.body.details.some(d => d.field === 'password'));
  });

  test('POST /api/flavours returns 400 on non-positive price', async () => {
    const res = await request(app)
      .post('/api/flavours')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Orange Juice',
        price: -50
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
    assert.ok(res.body.details.some(d => d.field === 'price'));
  });

  test('POST /api/receipts returns 400 when items list is empty', async () => {
    const res = await request(app)
      .post('/api/receipts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [],
        totalAmount: 0
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 'fail');
    assert.ok(res.body.details.some(d => d.field === 'items'));
  });
});
