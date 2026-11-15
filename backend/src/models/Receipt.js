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

receiptSchema.pre('validate', async function() {
  if (!this.receiptNumber && this.userId) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    this.receiptNumber = `RCP-${this.userId.toString().slice(-4)}-${Date.now()}-${count + 1}`;
  }
  if (this.subtotal === undefined && this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }
  if (this.totalAmount === undefined && this.subtotal !== undefined) {
    this.totalAmount = Math.max(0, this.subtotal - (this.discount || 0) + (this.taxAmount || 0));
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);
