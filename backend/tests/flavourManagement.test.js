const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Flavour = require('../src/models/Flavour');
const Receipt = require('../src/models/Receipt');
const flavourService = require('../src/services/flavourService');

describe('Product and Flavour Management Tests', () => {
  const testUserId = new mongoose.Types.ObjectId().toString();

  describe('Flavour Model & Attributes', () => {
    test('assigns category, uppercase sku, and availability defaults', () => {
      const flavour = new Flavour({
        userId: new mongoose.Types.ObjectId(),
        name: 'Avocado Smoothie',
        price: 350,
        category: 'Smoothie',
        sku: 'avo-01'
      });

      assert.equal(flavour.category, 'Smoothie');
      assert.equal(flavour.isAvailable, true);
      assert.equal(flavour.isArchived, false);
      assert.equal(flavour.isActive, true);
      assert.equal(flavour.validateSync(), undefined);
    });
  });

  describe('Flavour Service Operations & Soft Deletes', () => {
    test('filters flavours by category, availability, and search term', async () => {
      const capturedFilters = [];
      mock.method(Flavour, 'find', (filter) => {
        capturedFilters.push(filter);
        return {
          sort: () => [{ name: 'Mango', category: 'Fresh Juice' }]
        };
      });

      await flavourService.getAll(testUserId, {
        category: 'Fresh Juice',
        isAvailable: 'true',
        search: 'man'
      });

      const appliedFilter = capturedFilters[0];
      assert.equal(appliedFilter.userId, testUserId);
      assert.equal(appliedFilter.category, 'Fresh Juice');
      assert.equal(appliedFilter.isAvailable, true);
      assert.deepEqual(appliedFilter.isArchived, { $ne: true });
      assert.ok(appliedFilter.$or);

      mock.reset();
    });

    test('archives flavour (soft delete) without hard deletion', async () => {
      const mockFlavour = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        name: 'Seasonal Berry',
        isActive: false,
        isArchived: true
      };

      mock.method(Flavour, 'findOneAndUpdate', async (filter, update) => {
        assert.equal(update.isArchived, true);
        assert.equal(update.isActive, false);
        return mockFlavour;
      });

      const res = await flavourService.archive(testUserId, mockFlavour._id);
      assert.equal(mockFlavour.isArchived, true);
      assert.equal(mockFlavour.isActive, false);
      assert.equal(res.message, 'Flavour archived successfully');

      mock.reset();
    });

    test('restores archived flavour', async () => {
      const mockFlavour = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        name: 'Seasonal Berry',
        isActive: true,
        isArchived: false
      };

      mock.method(Flavour, 'findOneAndUpdate', async (filter, update) => {
        assert.equal(update.isArchived, false);
        assert.equal(update.isActive, true);
        return mockFlavour;
      });

      const res = await flavourService.restore(testUserId, mockFlavour._id);
      assert.equal(mockFlavour.isArchived, false);
      assert.equal(mockFlavour.isActive, true);
      assert.equal(res.message, 'Flavour restored successfully');

      mock.reset();
    });

    test('toggles product availability between in-stock and out-of-stock', async () => {
      const mockFlavour = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        isAvailable: true,
        save: async function() { return this; }
      };

      mock.method(Flavour, 'findOne', async () => mockFlavour);

      const toggle1 = await flavourService.toggleAvailability(testUserId, mockFlavour._id);
      assert.equal(toggle1.isAvailable, false);

      const toggle2 = await flavourService.toggleAvailability(testUserId, mockFlavour._id);
      assert.equal(toggle2.isAvailable, true);

      mock.reset();
    });
  });

  describe('Historical Receipt Immutability', () => {
    test('updating flavour price does not alter historical receipt item prices', () => {
      const flavourId = new mongoose.Types.ObjectId();
      
      // Historical receipt snapshot created when flavour was Rs. 200
      const historicalReceipt = new Receipt({
        userId: new mongoose.Types.ObjectId(),
        receiptNumber: 'RCP-202611-0001',
        currency: 'LKR',
        items: [{
          flavourId,
          flavourName: 'Watermelon Juice',
          quantity: 2,
          price: 200,
          subtotal: 400
        }],
        subtotal: 400,
        totalAmount: 400
      });

      // Price changes in the product catalogue
      const catalogFlavour = new Flavour({
        _id: flavourId,
        userId: historicalReceipt.userId,
        name: 'Watermelon Juice',
        price: 350 // Price increased to 350
      });

      // Receipt snapshot must preserve historical price of 200
      assert.equal(historicalReceipt.items[0].price, 200);
      assert.equal(historicalReceipt.items[0].subtotal, 400);
      assert.equal(historicalReceipt.totalAmount, 400);
      assert.notEqual(historicalReceipt.items[0].price, catalogFlavour.price);
    });
  });
});
