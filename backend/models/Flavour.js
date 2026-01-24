const mongoose = require('mongoose');

const flavourSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

flavourSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Flavour', flavourSchema);