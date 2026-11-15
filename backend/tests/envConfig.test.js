const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, envSchema } = require('../src/config/env');

describe('Environment Configuration & Validation Tests', () => {
  test('parses valid environment with coerced port and defaults', () => {
    const cfg = loadConfig({
      NODE_ENV: 'development',
      PORT: '5555',
      MONGODB_URI: 'mongodb://localhost:27017/dev-db',
      JWT_SECRET: 'super-secure-secret-key-12345',
    });

    assert.equal(cfg.PORT, 5555);
    assert.equal(cfg.NODE_ENV, 'development');
    assert.equal(cfg.MONGODB_URI, 'mongodb://localhost:27017/dev-db');
    assert.equal(cfg.JWT_EXPIRES_IN, '7d');
  });

  test('fails safely when MONGODB_URI is missing in production', () => {
    assert.throws(() => {
      loadConfig({
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: '',
        JWT_SECRET: 'valid-secret-key-long-enough',
        _throwOnly: true
      });
    }, /MONGODB_URI is required/);
  });

  test('fails safely when JWT_SECRET is too short in production', () => {
    assert.throws(() => {
      loadConfig({
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: 'mongodb://atlas-host/db',
        JWT_SECRET: 'short',
        _throwOnly: true
      });
    }, /JWT_SECRET must be at least 10 characters/);
  });

  test('provides robust defaults for test environment', () => {
    const cfg = loadConfig({ NODE_ENV: 'test' });
    assert.equal(cfg.NODE_ENV, 'test');
    assert.ok(cfg.JWT_SECRET.length >= 10);
    assert.ok(cfg.MONGODB_URI.includes('test'));
  });
});
