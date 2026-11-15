const { test, describe, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const app = require('../server');
const { config } = require('../src/config/env');
const User = require('../src/models/User');
const Flavour = require('../src/models/Flavour');
const Receipt = require('../src/models/Receipt');
const ReceiptCounter = require('../src/models/ReceiptCounter');
const tokenBlacklistService = require('../src/services/tokenBlacklistService');

describe('End-to-End API Integration Testing Suite (PR-34)', () => {
  const tenantUserId = new mongoose.Types.ObjectId().toString();
  const tenantEmail = 'owner@freshcitrus.lk';
  let authToken;
  let tokenJti;

  beforeEach(() => {
    tokenJti = `e2e-jti-${Date.now()}-${Math.random()}`;
    authToken = jwt.sign(
      { userId: tenantUserId, jti: tokenJti },
      config.JWT_SECRET,
      { expiresIn: '2h' }
    );
  });

  test('Step 1: Security perimeter rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/receipts');
    assert.equal(res.status, 401);
    assert.equal(res.body.status, 'fail');
    assert.ok(res.body.message.includes('No token provided'));
  });

  test('Step 2: Store Profile & Branding Configuration (PUT /api/auth/profile)', async () => {
    const mockUser = {
      _id: tenantUserId,
      businessName: 'Fresh Citrus Juice Bar',
      email: tenantEmail,
      receiptPrefix: 'CITRUS',
      tagline: '100% Artisan Fruit Drinks',
      logoIcon: '🍹',
      showLogo: true,
      defaultCurrency: 'LKR',
      taxEnabled: false,
      save: async function() { return this; },
      toObject: function() { return { ...this }; }
    };

    mock.method(User, 'findById', async () => mockUser);

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Fresh Citrus Juice Bar',
        receiptPrefix: 'CITRUS',
        tagline: '100% Artisan Fruit Drinks',
        logoIcon: '🍹',
        showLogo: true,
        defaultCurrency: 'LKR'
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.user);
    assert.equal(res.body.user.receiptPrefix, 'CITRUS');
    assert.equal(res.body.user.logoIcon, '🍹');

    mock.reset();
  });

  test('Step 3: Product Catalogue Management (POST /api/flavours & GET /api/flavours)', async () => {
    const mockCreatedFlavour = {
      _id: new mongoose.Types.ObjectId(),
      userId: tenantUserId,
      name: 'Avocado Lime Shake',
      price: 600,
      category: 'Special',
      sku: 'AVO-01',
      isAvailable: true,
      isArchived: false,
      save: async function() { return this; }
    };

    mock.method(Flavour, 'findOne', async () => null);
    mock.method(Flavour.prototype, 'save', async function() {
      return {
        _id: mockCreatedFlavour._id,
        userId: tenantUserId,
        name: this.name,
        price: this.price,
        category: this.category,
        sku: this.sku,
        isAvailable: true,
        isArchived: false
      };
    });
    mock.method(Flavour, 'find', () => ({
      sort: () => Promise.resolve([mockCreatedFlavour])
    }));

    // Create flavour
    const createRes = await request(app)
      .post('/api/flavours')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Avocado Lime Shake',
        price: 600,
        category: 'Special',
        sku: 'AVO-01'
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.name, 'Avocado Lime Shake');
    assert.equal(createRes.body.price, 600);

    // List catalogue
    const listRes = await request(app)
      .get('/api/flavours')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body));
    assert.equal(listRes.body.length, 1);
    assert.equal(listRes.body[0].name, 'Avocado Lime Shake');

    mock.reset();
  });

  test('Step 4: POS Receipt Creation with Decimal Calculation & Receipt Numbering', async () => {
    const mockReceipt = {
      _id: new mongoose.Types.ObjectId(),
      userId: tenantUserId,
      receiptNumber: 'CITRUS-202611-0001',
      items: [
        { flavourName: 'Avocado Lime Shake', quantity: 2, price: 600, subtotal: 1200 },
        { flavourName: 'Papaya Punch', quantity: 1, price: 400, subtotal: 400 }
      ],
      subtotal: 1600,
      discountAmount: 160,
      taxAmount: 0,
      totalAmount: 1440,
      paymentMethod: 'cash',
      cashReceived: 2000,
      changeAmount: 560,
      currency: 'LKR',
      status: 'issued',
      customer: { name: 'Sunil Shantha', phone: '+94 77 111 2222' },
      statusHistory: [{
        fromStatus: 'none',
        toStatus: 'issued',
        changedAt: new Date(),
        reason: 'POS Sale Checkout',
        changedBy: tenantUserId
      }]
    };

    mock.method(User, 'findById', () => ({
      select: () => ({
        lean: async () => ({
          _id: tenantUserId,
          receiptPrefix: 'CITRUS',
          defaultCurrency: 'LKR',
          taxEnabled: false,
          taxRate: 0
        })
      })
    }));

    mock.method(ReceiptCounter, 'findOneAndUpdate', async () => ({
      userId: tenantUserId,
      prefix: 'CITRUS',
      period: '202611',
      seq: 1
    }));

    mock.method(Receipt.prototype, 'save', async function() {
      return {
        ...mockReceipt,
        ...this.toObject?.()
      };
    });

    const res = await request(app)
      .post('/api/receipts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { flavourName: 'Avocado Lime Shake', quantity: 2, price: 600, subtotal: 1200 },
          { flavourName: 'Papaya Punch', quantity: 1, price: 400, subtotal: 400 }
        ],
        discountType: 'percent',
        discountValue: 10,
        paymentMethod: 'cash',
        cashReceived: 2000,
        currency: 'LKR',
        customer: { name: 'Sunil Shantha', phone: '+94 77 111 2222' }
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.receiptNumber.includes('202611-0001'));
    assert.equal(res.body.totalAmount, 1440);
    assert.equal(res.body.changeAmount, 560);
    assert.equal(res.body.status, 'issued');

    mock.reset();
  });

  test('Step 5: Financial Immutability rejects modifying issued receipts', async () => {
    const mockReceipt = {
      _id: new mongoose.Types.ObjectId(),
      userId: tenantUserId,
      receiptNumber: 'CITRUS-202611-0001',
      status: 'issued',
      items: [{ flavourName: 'Papaya Punch', quantity: 1, price: 400, subtotal: 400 }]
    };

    mock.method(Receipt, 'findOne', async () => mockReceipt);

    const res = await request(app)
      .put(`/api/receipts/${mockReceipt._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{ flavourName: 'Papaya Punch', quantity: 3, price: 400, subtotal: 1200 }]
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('financially immutable'));

    mock.reset();
  });

  test('Step 6: Receipt Voiding with Mandatory Audit Trail (POST /api/receipts/:id/void)', async () => {
    const receiptId = new mongoose.Types.ObjectId();
    const mockReceipt = {
      _id: receiptId,
      userId: tenantUserId,
      receiptNumber: 'CITRUS-202611-0001',
      status: 'issued',
      statusHistory: [{
        fromStatus: 'none',
        toStatus: 'issued',
        changedAt: new Date(),
        reason: 'Initial sale',
        changedBy: tenantUserId
      }],
      save: async function() { return this; }
    };

    mock.method(Receipt, 'findOne', async () => mockReceipt);

    const res = await request(app)
      .post(`/api/receipts/${receiptId}/void`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Customer mistakenly ordered wrong beverage size'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'voided');
    assert.equal(mockReceipt.statusHistory.length, 2);
    assert.equal(mockReceipt.statusHistory[1].toStatus, 'voided');
    assert.equal(mockReceipt.statusHistory[1].reason, 'Customer mistakenly ordered wrong beverage size');

    mock.reset();
  });

  test('Step 7: Business Analytics Reporting (GET /api/analytics/dashboard)', async () => {
    const mockAnalyticsData = {
      kpis: {
        totalRevenue: 28800,
        todayRevenue: 4800,
        totalReceipts: 20,
        issuedReceipts: 18,
        voidedReceipts: 2,
        averageOrderValue: 1600
      },
      topFlavours: [
        { name: 'Avocado Lime Shake', totalQuantity: 24, totalRevenue: 14400 },
        { name: 'Papaya Punch', totalQuantity: 18, totalRevenue: 7200 }
      ],
      paymentMethods: [
        { method: 'cash', count: 14, total: 20160 },
        { method: 'card', count: 4, total: 8640 }
      ],
      dailyTimeline: [
        { date: '2026-11-15', revenue: 4800, count: 3 }
      ]
    };

    mock.method(Receipt, 'aggregate', async () => [mockAnalyticsData]);

    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.metrics);
    assert.equal(res.body.currency, 'LKR');
    assert.ok(Array.isArray(res.body.topFlavours));

    mock.reset();
  });

  test('Step 8: Token Revocation & Logout (POST /api/auth/logout)', async () => {
    // Perform logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(logoutRes.status, 200);
    assert.ok(logoutRes.body.message);

    // Attempt to access protected route with revoked token
    const revokedAccessRes = await request(app)
      .get('/api/flavours')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(revokedAccessRes.status, 401);
    assert.equal(revokedAccessRes.body.status, 'fail');
    assert.ok(revokedAccessRes.body.message.includes('revoked'));
  });
});
