const Receipt = require('../models/Receipt');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class ReceiptService {
  async getAll(userId) {
    return Receipt.find({ userId })
      .populate('items.flavourId')
      .sort({ createdAt: -1 });
  }

  async getById(userId, receiptId) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId })
      .populate('items.flavourId');
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }
    return receipt;
  }

  async create(userId, { items, totalAmount, paymentMethod, customerName, notes }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Receipt must contain at least one item');
    }

    const receipt = new Receipt({
      userId,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      customerName: customerName ? customerName.trim() : undefined,
      notes: notes ? notes.trim() : undefined
    });

    return receipt.save();
  }

  async update(userId, receiptId, { items, totalAmount, paymentMethod, customerName, notes }) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    if (items) receipt.items = items;
    if (totalAmount !== undefined) receipt.totalAmount = totalAmount;
    if (paymentMethod) receipt.paymentMethod = paymentMethod;
    if (customerName !== undefined) receipt.customerName = customerName;
    if (notes !== undefined) receipt.notes = notes;

    return receipt.save();
  }

  async delete(userId, receiptId) {
    const receipt = await Receipt.findOneAndDelete({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }
    return { message: 'Receipt deleted successfully' };
  }
}

module.exports = new ReceiptService();
