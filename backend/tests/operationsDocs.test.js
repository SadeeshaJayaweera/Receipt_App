const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Operational Runbooks & Documentation Verification Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const operationsDir = path.join(rootDir, 'docs/operations');

  test('validates DEPLOYMENT_RUNBOOK.md exists with required operational sections', () => {
    const filePath = path.join(operationsDir, 'DEPLOYMENT_RUNBOOK.md');
    assert.ok(fs.existsSync(filePath), 'docs/operations/DEPLOYMENT_RUNBOOK.md must exist');

    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('System Architecture & Prerequisites'), 'Must include Prerequisites');
    assert.ok(content.includes('Environment Variables Specification'), 'Must include Environment Variables');
    assert.ok(content.includes('Standard Docker Compose Deployment'), 'Must include Docker Compose instructions');
    assert.ok(content.includes('Zero-Downtime Rolling Update Procedure'), 'Must include Zero-Downtime instructions');
    assert.ok(content.includes('Post-Deployment Verification'), 'Must include Smoke Test Checklist');
  });

  test('validates INCIDENT_RUNBOOK.md exists with severity matrix and recovery playbooks', () => {
    const filePath = path.join(operationsDir, 'INCIDENT_RUNBOOK.md');
    assert.ok(fs.existsSync(filePath), 'docs/operations/INCIDENT_RUNBOOK.md must exist');

    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('Incident Severity Classification Matrix'), 'Must include Severity Matrix');
    assert.ok(content.includes('SEV-1 (Critical)'), 'Must define SEV-1');
    assert.ok(content.includes('Disaster Recovery & Backup Procedures'), 'Must include Disaster Recovery');
    assert.ok(content.includes('mongodump'), 'Must include mongodump backup command');
    assert.ok(content.includes('mongorestore'), 'Must include mongorestore recovery command');
    assert.ok(content.includes('Compromised Secret Rotation Playbook'), 'Must include Secret Rotation');
  });

  test('validates PRINTER_SETUP_GUIDE.md exists with ESC/POS hardware and driver instructions', () => {
    const filePath = path.join(operationsDir, 'PRINTER_SETUP_GUIDE.md');
    assert.ok(fs.existsSync(filePath), 'docs/operations/PRINTER_SETUP_GUIDE.md must exist');

    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('Supported Thermal Printer Hardware'), 'Must include hardware compatibility');
    assert.ok(content.includes('Epson'), 'Must document Epson models');
    assert.ok(content.includes('Printer Driver & Operating System Setup'), 'Must document Driver setup');
    assert.ok(content.includes('Browser Print Settings Optimization'), 'Must document Browser settings');
    assert.ok(content.includes('Hidden Iframe Printing'), 'Must document hidden iframe printing architecture');
    assert.ok(content.includes('Troubleshooting Runbook'), 'Must include printer troubleshooting matrix');
  });
});
