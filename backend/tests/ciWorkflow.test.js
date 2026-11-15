const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('CI/CD Workflow & GitHub Actions Verification Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const ciPath = path.join(rootDir, '.github/workflows/ci.yml');

  test('validates CI workflow file exists in .github/workflows', () => {
    assert.ok(fs.existsSync(ciPath), '.github/workflows/ci.yml must exist');
  });

  test('validates CI workflow triggers on push and pull_request to master and develop', () => {
    const content = fs.readFileSync(ciPath, 'utf8');

    assert.ok(content.includes('branches: [ master, develop ]'), 'Must trigger on master and develop branches');
    assert.ok(content.includes('push:'), 'Must trigger on push');
    assert.ok(content.includes('pull_request:'), 'Must trigger on pull_request');
  });

  test('validates CI workflow defines backend, frontend, docker, and compliance jobs', () => {
    const content = fs.readFileSync(ciPath, 'utf8');

    // Jobs
    assert.ok(content.includes('backend-test:'), 'Must define backend-test job');
    assert.ok(content.includes('frontend-test-and-build:'), 'Must define frontend-test-and-build job');
    assert.ok(content.includes('docker-build-verification:'), 'Must define docker-build-verification job');
    assert.ok(content.includes('security-compliance:'), 'Must define security-compliance job');

    // Actions & commands
    assert.ok(content.includes('actions/checkout@v4'), 'Must use actions/checkout@v4');
    assert.ok(content.includes('actions/setup-node@v4'), 'Must use actions/setup-node@v4 with Node 20');
    assert.ok(content.includes('npm test'), 'Must execute npm test suites');
    assert.ok(content.includes('npm run build'), 'Must execute npm run build');
    assert.ok(content.includes('docker/build-push-action@v5'), 'Must execute Docker build validation');
  });
});
