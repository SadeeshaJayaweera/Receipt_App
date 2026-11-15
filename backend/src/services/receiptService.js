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

  async create(userId, {
    items,
    currency,
    status,
    subtotal,
    discount,
    taxRate,
    taxAmount,
    totalAmount,
    paymentMethod,
    customerName,
    customerPhone,
    customerEmail,
    notes
  }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Receipt must contain at least one item');
    }

    const calculatedSubtotal = subtotal !== undefined
      ? subtotal
      : items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    const calculatedTotal = totalAmount !== undefined
      ? totalAmount
      : Math.max(0, calculatedSubtotal - (discount || 0) + (taxAmount || 0));

    const receipt = new Receipt({
      userId,
      items,
      currency: currency || 'LKR',
      status: status || 'issued',
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      taxRate: taxRate || 0,
      taxAmount: taxAmount || 0,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'cash',
      customerName: customerName ? customerName.trim() : undefined,
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      notes: notes ? notes.trim() : undefined
    });

    return receipt.save();
  }

  async update(userId, receiptId, updateData) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    const allowedFields = [
      'items', 'currency', 'status', 'subtotal', 'discount',
      'taxRate', 'taxAmount', 'totalAmount', 'paymentMethod',
      'customerName', 'customerPhone', 'customerEmail', 'notes'
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        receipt[field] = typeof updateData[field] === 'string'
          ? updateData[field].trim()
          : updateData[field];
      }
    });

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
