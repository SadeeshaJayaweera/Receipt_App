const Receipt = require('../models/Receipt');
const receiptNumberService = require('./receiptNumberService');
const { calculateReceiptTotals } = require('../utils/calcEngine');
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

  async create(userId, data) {
    const {
      items,
      receiptNumber,
      currency,
      status,
      discount,
      discountType,
      discountValue,
      taxEnabled,
      taxRate,
      paymentMethod,
      customerName,
      customerPhone,
      customerEmail,
      notes
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Receipt must contain at least one item');
    }

    // Authoritative financial calculations
    const totals = calculateReceiptTotals({
      items,
      discount: discount !== undefined ? discount : discountValue,
      discountType: discountType || 'fixed',
      taxEnabled: taxEnabled !== undefined ? taxEnabled : (Number(taxRate) > 0),
      taxRate: Number(taxRate) || 0,
      currency: currency || 'LKR'
    });

    const finalReceiptNumber = receiptNumber || await receiptNumberService.generateNextReceiptNumber(userId);

    const receipt = new Receipt({
      userId,
      receiptNumber: finalReceiptNumber,
      items: totals.items,
      currency: totals.currency,
      status: status || 'issued',
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
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

    const items = updateData.items || receipt.items;
    const discount = updateData.discount !== undefined ? updateData.discount : receipt.discount;
    const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : receipt.taxRate;
    const taxEnabled = updateData.taxEnabled !== undefined ? updateData.taxEnabled : (taxRate > 0);
    const currency = updateData.currency || receipt.currency;

    const totals = calculateReceiptTotals({
      items,
      discount,
      taxEnabled,
      taxRate,
      currency
    });

    receipt.items = totals.items;
    receipt.subtotal = totals.subtotal;
    receipt.discount = totals.discount;
    receipt.taxRate = totals.taxRate;
    receipt.taxAmount = totals.taxAmount;
    receipt.totalAmount = totals.totalAmount;
    receipt.currency = totals.currency;

    if (updateData.status) receipt.status = updateData.status;
    if (updateData.paymentMethod) receipt.paymentMethod = updateData.paymentMethod;
    if (updateData.customerName !== undefined) receipt.customerName = updateData.customerName.trim();
    if (updateData.customerPhone !== undefined) receipt.customerPhone = updateData.customerPhone.trim();
    if (updateData.customerEmail !== undefined) receipt.customerEmail = updateData.customerEmail.trim();
    if (updateData.notes !== undefined) receipt.notes = updateData.notes.trim();

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
