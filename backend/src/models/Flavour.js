const mongoose = require('mongoose');

const flavourSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner userId is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Flavour name is required'],
    trim: true,
    minlength: 1,
    maxlength: 80
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a non-negative number']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for user scoped lookups and uniqueness
flavourSchema.index({ userId: 1, name: 1 }, { unique: true });
flavourSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Flavour', flavourSchema);
