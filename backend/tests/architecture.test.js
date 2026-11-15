const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../src/errors/AppError');

describe('Backend Modular Architecture Tests', () => {
  test('custom AppError classes instantiate with expected status codes', () => {
    const badReq = new BadRequestError('Invalid input');
    assert.equal(badReq.statusCode, 400);
    assert.equal(badReq.status, 'fail');
    assert.equal(badReq.isOperational, true);

    const notFound = new NotFoundError('Item missing');
    assert.equal(notFound.statusCode, 404);
    assert.equal(notFound.status, 'fail');

    const unauth = new UnauthorizedError('No access');
    assert.equal(unauth.statusCode, 401);
  });

  test('routes mount properly under /api/auth, /api/flavours, /api/receipts', async () => {
    // Unauthenticated request to /api/flavours should return 401 from modular route stack
    const res = await request(app).get('/api/flavours');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'No token provided');
  });

  test('unauthenticated request to /api/receipts returns 401', async () => {
    const res = await request(app).get('/api/receipts');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'No token provided');
  });
});
