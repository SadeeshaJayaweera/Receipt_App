const mongoose = require('mongoose');

const receiptCounterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner userId is required'],
    index: true
  },
  prefix: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    default: 'RCP',
    maxlength: 10
  },
  period: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{6}$/, 'Period must be in YYYYMM format']
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure strict uniqueness per business tenant, prefix, and period
receiptCounterSchema.index({ userId: 1, prefix: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('ReceiptCounter', receiptCounterSchema);
