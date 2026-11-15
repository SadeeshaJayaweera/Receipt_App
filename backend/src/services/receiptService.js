const Receipt = require('../models/Receipt');
const receiptNumberService = require('./receiptNumberService');
const receiptValidationService = require('./receiptValidationService');
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
      paymentMethod = 'cash',
      cashReceived,
      customerName,
      customerPhone,
      customerEmail,
      notes
    } = data;

    // Validate and merge duplicate line items
    const normalizedItems = receiptValidationService.validateAndNormalizeItems(items);

    const discountAmount = discount !== undefined ? discount : discountValue;
    const isTaxEnabled = taxEnabled !== undefined ? taxEnabled : (Number(taxRate) > 0);

    // Validate tax configuration
    receiptValidationService.validateTax(isTaxEnabled, taxRate);

    // Authoritative financial calculations
    const totals = calculateReceiptTotals({
      items: normalizedItems,
      discount: discountAmount,
      discountType: discountType || 'fixed',
      taxEnabled: isTaxEnabled,
      taxRate: Number(taxRate) || 0,
      currency: currency || 'LKR'
    });

    // Validate discount against calculated subtotal
    receiptValidationService.validateDiscount(discountAmount, discountType, totals.subtotal);

    // Validate financial upper bounds
    receiptValidationService.validateFinancialBounds(totals.subtotal, totals.totalAmount);

    // Validate payment method and cash sufficiency
    receiptValidationService.validatePayment(paymentMethod, totals.totalAmount, cashReceived);

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
      paymentMethod,
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

    let items = receipt.items;
    if (updateData.items) {
      items = receiptValidationService.validateAndNormalizeItems(updateData.items);
    }

    const discount = updateData.discount !== undefined ? updateData.discount : receipt.discount;
    const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : receipt.taxRate;
    const taxEnabled = updateData.taxEnabled !== undefined ? updateData.taxEnabled : (taxRate > 0);
    const currency = updateData.currency || receipt.currency;
    const paymentMethod = updateData.paymentMethod || receipt.paymentMethod;

    receiptValidationService.validateTax(taxEnabled, taxRate);

    const totals = calculateReceiptTotals({
      items,
      discount,
      discountType: updateData.discountType || 'fixed',
      taxEnabled,
      taxRate,
      currency
    });

    receiptValidationService.validateDiscount(discount, updateData.discountType, totals.subtotal);
    receiptValidationService.validateFinancialBounds(totals.subtotal, totals.totalAmount);
    receiptValidationService.validatePayment(paymentMethod, totals.totalAmount, updateData.cashReceived);

    receipt.items = totals.items;
    receipt.subtotal = totals.subtotal;
    receipt.discount = totals.discount;
    receipt.taxRate = totals.taxRate;
    receipt.taxAmount = totals.taxAmount;
    receipt.totalAmount = totals.totalAmount;
    receipt.currency = totals.currency;
    receipt.paymentMethod = paymentMethod;

    if (updateData.status) receipt.status = updateData.status;
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
