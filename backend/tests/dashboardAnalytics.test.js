const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../server');
const Receipt = require('../src/models/Receipt');
const analyticsService = require('../src/services/analyticsService');
const { config } = require('../src/config/env');

describe('Business Dashboard & Sales Analytics Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();
  const authToken = jwt.sign({ userId: testUserId }, config.JWT_SECRET, { expiresIn: '1h' });

  test('aggregates revenue, counts, top flavours, and payment breakdown for target currency', async () => {
    let callIndex = 0;
    mock.method(Receipt, 'aggregate', async (pipeline) => {
      // Ensure initial stage matches tenant and target currency
      const matchStage = pipeline[0].$match;
      assert.equal(matchStage.userId.toString(), testUserId);

      callIndex++;
      if (callIndex === 1) {
        // Summary aggregation
        return [{
          totalCount: 15,
          issuedCount: 10,
          draftCount: 3,
          voidedCount: 2,
          totalRevenue: 5000,
          todayRevenue: 1200,
          todayReceipts: 3,
          weekRevenue: 3500,
          monthRevenue: 5000
        }];
      } else if (callIndex === 2) {
        // Top flavours
        return [
          { name: 'Papaya Juice', quantity: 20, revenue: 3000 },
          { name: 'Lime Juice', quantity: 15, revenue: 2000 }
        ];
      } else if (callIndex === 3) {
        // Payment breakdown
        return [
          { method: 'cash', count: 7, totalRevenue: 3500 },
          { method: 'card', count: 3, totalRevenue: 1500 }
        ];
      } else if (callIndex === 4) {
        // Timeline
        return [
          { date: '2026-11-14', revenue: 2000, count: 4 },
          { date: '2026-11-15', revenue: 3000, count: 6 }
        ];
      } else {
        // Multi-currency summary
        return [
          { currency: 'LKR', totalRevenue: 5000, count: 10 },
          { currency: 'USD', totalRevenue: 150, count: 2 }
        ];
      }
    });

    const summary = await analyticsService.getDashboardSummary(testUserId, { currency: 'LKR' });

    assert.equal(summary.currency, 'LKR');
    assert.equal(summary.metrics.totalRevenue, 5000);
    assert.equal(summary.metrics.todayRevenue, 1200);
    assert.equal(summary.metrics.avgOrderValue, 500); // 5000 / 10 = 500
    assert.equal(summary.metrics.counts.issued, 10);
    assert.equal(summary.metrics.counts.draft, 3);
    assert.equal(summary.metrics.counts.voided, 2);

    assert.equal(summary.topFlavours.length, 2);
    assert.equal(summary.topFlavours[0].name, 'Papaya Juice');

    assert.equal(summary.paymentBreakdown.length, 2);
    assert.equal(summary.dailyTimeline.length, 2);
    assert.equal(summary.multiCurrencySummary.length, 2);

    mock.reset();
  });

  test('GET /api/analytics/dashboard returns 401 when unauthorized', async () => {
    const res = await request(app).get('/api/analytics/dashboard');
    assert.equal(res.status, 401);
  });

  test('GET /api/analytics/dashboard returns 200 and metrics when authenticated', async () => {
    mock.method(Receipt, 'aggregate', async () => []);

    const res = await request(app)
      .get('/api/analytics/dashboard?currency=LKR')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.currency, 'LKR');
    assert.ok(res.body.metrics);
    assert.ok(Array.isArray(res.body.topFlavours));
    assert.ok(Array.isArray(res.body.paymentBreakdown));
    assert.ok(Array.isArray(res.body.dailyTimeline));

    mock.reset();
  });
});
