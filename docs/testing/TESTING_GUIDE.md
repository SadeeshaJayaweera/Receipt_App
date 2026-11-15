# Testing Guide: Juice Receipt App

## Overview
This document establishes the testing standards, frameworks, and command patterns for the application.

## 1. Test Architecture

### Backend
- **Runner:** Node.js native test runner (`node:test`, `node:assert/strict`).
- **Integration HTTP Testing:** `supertest`.
- **Location:** `backend/tests/**/*.test.js`.
- **Environment:** Node.js 20.x, isolated test port, conditional database connection in test mode (`NODE_ENV=test`).

### Frontend
- **Runner:** `vitest`.
- **DOM Environment:** `jsdom`.
- **Component Testing:** `@testing-library/react` and `@testing-library/jest-dom`.
- **Configuration:** `frontend/vitest.config.mjs`.
- **Location:** `frontend/src/**/*.test.jsx`.

## 2. Running Tests

### Root (Full Suite)
```bash
npm test
```
Runs both backend and frontend suites sequentially.

### Backend Only
```bash
npm run test:backend
# or
cd backend && npm test
```

### Frontend Only
```bash
npm run test:frontend
# or
cd frontend && npm test
```

## 3. Writing Tests

### Backend Unit & Integration Tests Example
```js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

describe('Module Name', () => {
  test('behavior description', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
  });
});
```

### Frontend Component Tests Example
```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Component Name', () => {
  test('behavior description', () => {
    render(<App />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```
