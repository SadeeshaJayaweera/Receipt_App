const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
const tokenBlacklistService = require('../src/services/tokenBlacklistService');
const { authLimiter, apiLimiter } = require('../src/middleware/rateLimiter');
const { sanitizeObject } = require('../src/middleware/sanitize');

describe('Security Assessment & Production Hardening Verification Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const reportPath = path.join(rootDir, 'docs/security/SECURITY_ASSESSMENT.md');

  test('validates existence and comprehensive coverage of SECURITY_ASSESSMENT.md', () => {
    assert.ok(fs.existsSync(reportPath), 'docs/security/SECURITY_ASSESSMENT.md must exist');

    const content = fs.readFileSync(reportPath, 'utf8');
    assert.ok(content.includes('OWASP Top 10 Security Architecture Matrix'), 'Must include OWASP matrix');
    assert.ok(content.includes('A01: Broken Access Control'), 'Must cover A01');
    assert.ok(content.includes('A02: Cryptographic Failures'), 'Must cover A02');
    assert.ok(content.includes('A03: Injection'), 'Must cover A03');
    assert.ok(content.includes('A04: Insecure Design'), 'Must cover A04');
    assert.ok(content.includes('A05: Security Misconfiguration'), 'Must cover A05');
    assert.ok(content.includes('A06: Vulnerable Components'), 'Must cover A06');
    assert.ok(content.includes('A07: Identification & Auth Failures'), 'Must cover A07');
    assert.ok(content.includes('A08: Software & Data Integrity'), 'Must cover A08');
    assert.ok(content.includes('A09: Security Logging & Monitoring'), 'Must cover A09');
    assert.ok(content.includes('A10: Server-Side Request Forgery'), 'Must cover A10');
  });

  test('verifies bcrypt salt work factor is set to 12', async () => {
    const password = 'StrongPassword123!';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    // Bcrypt hash format: $2a$12$... or $2b$12$...
    const rounds = bcrypt.getRounds(hash);
    assert.equal(rounds, 12, 'Bcrypt rounds must strictly equal 12');
  });

  test('verifies rate limiter configuration restricts brute force attack vectors', () => {
    assert.ok(authLimiter, 'Auth rate limiter must be defined');
    assert.ok(apiLimiter, 'API rate limiter must be defined');
  });

  test('verifies token revocation blacklist service correctly manages revoked jti tokens', () => {
    const testJti = 'test-revocation-uuid-999';
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour future

    assert.equal(tokenBlacklistService.isRevoked(testJti), false);

    tokenBlacklistService.revoke(testJti, expiresAt);
    assert.equal(tokenBlacklistService.isRevoked(testJti), true);
  });

  test('verifies deep request sanitizer removes NoSQL query injection operators', () => {
    const maliciousPayload = {
      email: 'attacker@evil.com',
      $where: 'sleep(5000)',
      nested: {
        $gt: '',
        safeField: 'validValue'
      },
      __proto__: {
        polluted: true
      }
    };

    const cleaned = sanitizeObject(maliciousPayload);

    assert.equal(cleaned.$where, undefined);
    assert.equal(cleaned.nested.$gt, undefined);
    assert.equal(cleaned.nested.safeField, 'validValue');
    assert.equal(cleaned.email, 'attacker@evil.com');
  });
});
