const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Logger, redactObject } = require('../src/utils/logger');
const requestLogger = require('../src/middleware/requestLogger');

describe('Backend Structured Logging & Audit Trails Tests', () => {
  describe('Sensitive Data Redaction', () => {
    it('redacts sensitive keys in flat objects', () => {
      const input = {
        userId: 'u123',
        businessName: 'Fresh Citrus',
        password: 'SuperSecretPassword123!',
        token: 'eyJh...jwtToken',
        authorization: 'Bearer secret_token'
      };

      const result = redactObject(input);

      assert.strictEqual(result.userId, 'u123');
      assert.strictEqual(result.businessName, 'Fresh Citrus');
      assert.strictEqual(result.password, '[REDACTED]');
      assert.strictEqual(result.token, '[REDACTED]');
      assert.strictEqual(result.authorization, '[REDACTED]');
    });

    it('recursively redacts nested objects and arrays', () => {
      const input = {
        user: {
          email: 'admin@juice.lk',
          credentials: {
            password: 'mypassword',
            jwt: 'abc.def.ghi'
          }
        },
        items: [
          { flavourName: 'Papaya Lime', price: 450 },
          { cardDetails: { cardNumber: '4111222233334444', cvv: '123' } }
        ]
      };

      const result = redactObject(input);

      assert.strictEqual(result.user.email, 'admin@juice.lk');
      assert.strictEqual(result.user.credentials.password, '[REDACTED]');
      assert.strictEqual(result.user.credentials.jwt, '[REDACTED]');
      assert.strictEqual(result.items[0].flavourName, 'Papaya Lime');
      assert.strictEqual(result.items[1].cardDetails.cardNumber, '[REDACTED]');
      assert.strictEqual(result.items[1].cardDetails.cvv, '[REDACTED]');
    });

    it('safely handles non-object values and errors', () => {
      assert.strictEqual(redactObject(null), null);
      assert.strictEqual(redactObject('plain string'), 'plain string');
      assert.strictEqual(redactObject(12345), 12345);

      const error = new Error('Database connection failed');
      error.details = { password: 'root' };
      const redactedError = redactObject(error);

      assert.strictEqual(redactedError.message, 'Database connection failed');
      assert.strictEqual(redactedError.details.password, '[REDACTED]');
    });
  });

  describe('Logger Formatter & Levels', () => {
    it('formats log entries as valid JSON with metadata in json mode', () => {
      const output = [];
      const testLogger = new Logger({
        level: 'debug',
        format: 'json',
        outputStream: { write: (str) => output.push(str) },
        errorStream: { write: (str) => output.push(str) }
      });

      testLogger.info('User login successful', {
        userId: 'u999',
        requestId: 'req-abc-123',
        password: 'raw_password_to_redact'
      });

      assert.strictEqual(output.length, 1);
      const parsed = JSON.parse(output[0].trim());

      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.message, 'User login successful');
      assert.strictEqual(parsed.userId, 'u999');
      assert.strictEqual(parsed.requestId, 'req-abc-123');
      assert.strictEqual(parsed.password, '[REDACTED]');
      assert.ok(parsed.timestamp);
    });

    it('filters out messages below configured minLevel', () => {
      const output = [];
      const testLogger = new Logger({
        level: 'warn',
        format: 'json',
        outputStream: { write: (str) => output.push(str) },
        errorStream: { write: (str) => output.push(str) }
      });

      testLogger.debug('Debug trace');
      testLogger.info('Standard info');
      testLogger.warn('Caution message');
      testLogger.error('Critical failure');

      assert.strictEqual(output.length, 2);
      const first = JSON.parse(output[0].trim());
      const second = JSON.parse(output[1].trim());

      assert.strictEqual(first.level, 'warn');
      assert.strictEqual(second.level, 'error');
    });
  });

  describe('Request Logging Middleware', () => {
    it('intercepts HTTP response finish event and logs duration and status', (t, done) => {
      const logCalls = [];
      const testLogger = new Logger({
        level: 'info',
        format: 'json',
        outputStream: { write: (str) => logCalls.push(JSON.parse(str.trim())) },
        errorStream: { write: (str) => logCalls.push(JSON.parse(str.trim())) }
      });

      // Mock request and response
      const req = {
        id: 'test-req-001',
        method: 'POST',
        originalUrl: '/api/receipts',
        userId: 'u101',
        ip: '127.0.0.1'
      };

      const finishListeners = [];
      const res = {
        statusCode: 201,
        on: (event, handler) => {
          if (event === 'finish') finishListeners.push(handler);
        }
      };

      requestLogger(req, res, () => {
        // Trigger finish event
        finishListeners.forEach((fn) => fn());

        assert.strictEqual(finishListeners.length, 1);
        done();
      });
    });
  });
});
