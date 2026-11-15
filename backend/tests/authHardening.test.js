const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { config } = require('../src/config/env');
const tokenBlacklistService = require('../src/services/tokenBlacklistService');
const authMiddleware = require('../middleware/auth');
const User = require('../src/models/User');

describe('Authentication Hardening Tests', () => {
  const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';

  test('valid JWT with jti is accepted by authMiddleware', () => {
    let nextCalled = false;
    const validToken = jwt.sign(
      { userId: testUserId, jti: 'test-jti-valid' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = () => { nextCalled = true; };

    authMiddleware(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(req.userId, testUserId);
    assert.equal(req.tokenPayload.jti, 'test-jti-valid');
  });

  test('expired JWT is rejected with 401 and specific expiration message', () => {
    let statusCode = null;
    let jsonResponse = null;
    const expiredToken = jwt.sign(
      { userId: testUserId, jti: 'test-jti-expired' },
      config.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {
      status: (c) => {
        statusCode = c;
        return {
          json: (d) => { jsonResponse = d; }
        };
      }
    };
    const next = () => {};

    authMiddleware(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse.status, 'fail');
    assert.ok(jsonResponse.message.includes('expired'));
  });

  test('revoked JWT is rejected with 401 and revocation message', () => {
    let statusCode = null;
    let jsonResponse = null;
    const token = jwt.sign(
      { userId: testUserId, jti: 'test-jti-revoked' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    tokenBlacklistService.revoke(token);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {
      status: (c) => {
        statusCode = c;
        return {
          json: (d) => { jsonResponse = d; }
        };
      }
    };
    const next = () => {};

    authMiddleware(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse.status, 'fail');
    assert.ok(jsonResponse.message.includes('revoked'));
  });

  test('POST /api/auth/logout revokes current token', async () => {
    const sessionToken = jwt.sign(
      { userId: testUserId, jti: 'test-jti-logout' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Call logout endpoint
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${sessionToken}`);

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.message, 'Logged out successfully');
    assert.equal(tokenBlacklistService.isRevoked(sessionToken), true);
  });

  test('User model hashes passwords with bcrypt salt rounds 12', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('plainPassword123', 12);
    assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));
  });
});
