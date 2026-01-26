const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  flavourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flavour' },
  flavourName: String,
  quantity: Number,
  price: Number,
  subtotal: Number
});

const receiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiptNumber: { type: String, unique: true },
  items: [receiptItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], default: 'cash' },
  customerName: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

receiptSchema.pre('save', async function() {
  if (!this.receiptNumber) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    this.receiptNumber = `RCP-${this.userId.toString().slice(-4)}-${Date.now()}-${count + 1}`;
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);