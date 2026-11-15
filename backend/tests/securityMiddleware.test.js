const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { sanitizeObject } = require('../src/middleware/sanitize');

describe('API Abuse Protection & Security Middleware Tests', () => {
  test('responses include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy']);
    assert.ok(res.headers['strict-transport-security']);
  });

  test('sanitizer removes dangerous NoSQL operators and prototype pollution keys', () => {
    const maliciousPayload = {
      name: 'Safe Name',
      $where: 'sleep(5000)',
      $gt: '',
      __proto__: { isAdmin: true },
      nested: {
        $regex: '.*',
        validKey: 123
      }
    };

    const clean = sanitizeObject(maliciousPayload);

    assert.equal(clean.name, 'Safe Name');
    assert.equal(clean.$where, undefined);
    assert.equal(clean.$gt, undefined);
    assert.equal(clean.__proto__, Object.prototype); // Unpolluted
    assert.equal(clean.nested.$regex, undefined);
    assert.equal(clean.nested.validKey, 123);
  });

  test('rejects request exceeding 1MB payload limit with HTTP 413', async () => {
    // Generate a payload slightly larger than 1MB
    const largeString = 'A'.repeat(1.2 * 1024 * 1024);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ largeData: largeString }));

    assert.equal(res.status, 413);
  });
});
