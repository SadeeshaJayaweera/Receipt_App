const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  flavourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flavour'
  },
  flavourName: {
    type: String,
    required: [true, 'Flavour name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  price: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: [true, 'Line item subtotal is required'],
    min: [0, 'Line item subtotal cannot be negative']
  }
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner userId is required'],
    index: true
  },
  receiptNumber: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    enum: {
      values: ['LKR', 'USD'],
      message: '{VALUE} is not a supported currency. Must be LKR or USD.'
    },
    default: 'LKR',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'voided'],
    default: 'issued',
    required: true
  },
  voidedAt: {
    type: Date,
    default: null
  },
  voidReason: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  statusHistory: [{
    _id: false,
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  items: {
    type: [receiptItemSchema],
    required: [true, 'Receipt must contain at least one item'],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Receipt must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile'],
    default: 'cash',
    required: true
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  customerPhone: {
    type: String,
    trim: true,
    default: ''
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  customer: {
    name: { type: String, trim: true, maxlength: 100, default: '' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    loyaltyNumber: { type: String, trim: true, maxlength: 50, default: '' },
    notes: { type: String, trim: true, maxlength: 300, default: '' }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile'],
      default: 'cash'
    },
    cashReceived: {
      type: Number,
      min: 0,
      default: 0
    },
    changeGiven: {
      type: Number,
      min: 0,
      default: 0
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for performant business queries and uniqueness
receiptSchema.index({ userId: 1, createdAt: -1 });
receiptSchema.index({ userId: 1, receiptNumber: 1 }, { unique: true });
receiptSchema.index({ userId: 1, currency: 1, status: 1 });
receiptSchema.index({ userId: 1, 'customer.phone': 1 });
receiptSchema.index({ userId: 1, 'customer.name': 1 });

receiptSchema.pre('validate', async function() {
  // Sync structured customer and flat legacy fields
  if (!this.customer) this.customer = {};
  if (this.customerName && !this.customer.name) this.customer.name = this.customerName;
  if (!this.customerName && this.customer.name) this.customerName = this.customer.name;
  if (this.customerPhone && !this.customer.phone) this.customer.phone = this.customerPhone;
  if (!this.customerPhone && this.customer.phone) this.customerPhone = this.customerPhone;
  if (this.customerEmail && !this.customer.email) this.customer.email = this.customerEmail;
  if (!this.customerEmail && this.customer.email) this.customerEmail = this.customerEmail;

  // Sync payment object and paymentMethod
  if (!this.payment) this.payment = {};
  if (this.paymentMethod && !this.payment.method) this.payment.method = this.paymentMethod;
  if (this.payment.method && this.paymentMethod !== this.payment.method) this.paymentMethod = this.payment.method;
  if (!this.receiptNumber && this.userId) {
    try {
      const receiptNumberService = require('../services/receiptNumberService');
      this.receiptNumber = await receiptNumberService.generateNextReceiptNumber(this.userId);
    } catch {
      // Fallback in case of mock environment without database
      const fallbackPeriod = new Date().toISOString().slice(0, 7).replace('-', '');
      this.receiptNumber = `RCP-${fallbackPeriod}-0001`;
    }
  }
  if (this.subtotal === undefined && this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }
  if (this.totalAmount === undefined && this.subtotal !== undefined) {
    this.totalAmount = Math.max(0, this.subtotal - (this.discount || 0) + (this.taxAmount || 0));
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);
