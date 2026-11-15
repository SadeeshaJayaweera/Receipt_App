const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Health & Observability Probes Suite', () => {
  test('GET /api/health returns 200, system metrics, uptime, and memory statistics', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.environment);
    assert.ok(res.body.memory);
    assert.ok(res.body.memory.rss);
    assert.ok(res.body.memory.heapUsed);
  });

  test('GET /api/health/live returns 200 and alive status for liveness probes', async () => {
    const res = await request(app).get('/api/health/live');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'alive');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
    assert.ok(res.body.timestamp);
  });

  test('GET /api/health/ready handles database connectivity states accurately', async () => {
    const res = await request(app).get('/api/health/ready');

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ready');
      assert.equal(res.body.database, 'connected');
    } else {
      assert.equal(res.status, 503);
      assert.equal(res.body.status, 'unready');
      assert.equal(res.body.database, 'disconnected');
      assert.ok(res.body.message);
    }
  });
});
