const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Health API Integration Tests', () => {
  test('GET /api/health returns 200 and status OK', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.ok(res.body.mongodb !== undefined);
  });
});
