const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Final Engineering Audit & Release Validation Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const finalAuditPath = path.join(rootDir, 'docs/engineering/FINAL_AUDIT_REPORT.md');
  const releaseNotesPath = path.join(rootDir, 'RELEASE_NOTES.md');
  const readmePath = path.join(rootDir, 'README.md');

  test('validates existence and completeness of FINAL_AUDIT_REPORT.md', () => {
    assert.ok(fs.existsSync(finalAuditPath), 'docs/engineering/FINAL_AUDIT_REPORT.md must exist');

    const content = fs.readFileSync(finalAuditPath, 'utf8');
    assert.ok(content.includes('Executive Summary'), 'Must include Executive Summary');
    assert.ok(content.includes('Initial State vs. Final State Transformation Analysis'), 'Must include comparative transformation analysis');
    assert.ok(content.includes('Complete 40-Pull-Request Implementation Ledger'), 'Must include 40-PR ledger');

    // Verify all 40 PRs are tracked
    for (let i = 1; i <= 40; i++) {
      const prStr = i < 10 ? `**0${i}**` : `**${i}**`;
      assert.ok(content.includes(prStr), `Ledger must record PR-${i}`);
    }

    assert.ok(content.includes('Automated Quality & Verification Metrics'), 'Must include quality metrics');
    assert.ok(content.includes('APPROVED FOR PRODUCTION RELEASE'), 'Must include production sign-off');
  });

  test('validates existence and completeness of RELEASE_NOTES.md', () => {
    assert.ok(fs.existsSync(releaseNotesPath), 'RELEASE_NOTES.md must exist');

    const content = fs.readFileSync(releaseNotesPath, 'utf8');
    assert.ok(content.includes('Release Notes - Juice Receipt App v2.0.0'), 'Must document v2.0.0 release');
    assert.ok(content.includes('Modern Material UI Design System'), 'Must document MUI system');
    assert.ok(content.includes('Authoritative Decimal Calculation Engine'), 'Must document calcEngine');
    assert.ok(content.includes('80mm ESC/POS Continuous Thermal Printing'), 'Must document 80mm printing');
  });

  test('validates updated README.md contains production documentation index and architecture', () => {
    assert.ok(fs.existsSync(readmePath), 'README.md must exist');

    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(content.includes('Juice Receipt App (v2.0.0 Production Release)'), 'README must reflect v2.0.0');
    assert.ok(content.includes('Quick Start Guide'), 'Must include Quick Start Guide');
    assert.ok(content.includes('docker compose up -d --build'), 'Must include Docker Compose instructions');
    assert.ok(content.includes('FINAL_AUDIT_REPORT.md'), 'Must link to FINAL_AUDIT_REPORT.md');
    assert.ok(content.includes('DEPLOYMENT_RUNBOOK.md'), 'Must link to DEPLOYMENT_RUNBOOK.md');
  });
});
