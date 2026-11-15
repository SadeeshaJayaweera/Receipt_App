const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

describe('Auth Middleware Unit Tests', () => {
  const secret = 'test-secret-key-12345';
  process.env.JWT_SECRET = secret;

  test('rejects request with 401 when no authorization header is provided', () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = { headers: {} };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          }
        };
      }
    };
    const next = () => { nextCalled = true; };

    authMiddleware(req, res, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(jsonResponse, { message: 'No token provided' });
    assert.equal(nextCalled, false);
  });

  test('rejects request with 401 when token is invalid or malformed', () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = { headers: { authorization: 'Bearer invalid.token.value' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          }
        };
      }
    };
    const next = () => { nextCalled = true; };

    authMiddleware(req, res, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(jsonResponse, { message: 'Invalid token' });
    assert.equal(nextCalled, false);
  });

  test('accepts valid JWT, extracts userId, and calls next()', () => {
    let nextCalled = false;
    const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
    const validToken = jwt.sign({ userId: testUserId }, secret, { expiresIn: '1h' });

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = () => { nextCalled = true; };

    authMiddleware(req, res, next);

    assert.equal(nextCalled, true);
    assert.equal(req.userId, testUserId);
  });
});
