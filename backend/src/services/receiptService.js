const Receipt = require('../models/Receipt');
const receiptNumberService = require('./receiptNumberService');
const receiptValidationService = require('./receiptValidationService');
const { calculateReceiptTotals, calculateChange } = require('../utils/calcEngine');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class ReceiptService {
  async getAll(userId, query = {}) {
    const filter = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.currency) {
      filter.currency = query.currency;
    }

    if (query.customerPhone) {
      const phoneRegex = new RegExp(query.customerPhone.trim(), 'i');
      filter.$or = [
        { 'customer.phone': phoneRegex },
        { customerPhone: phoneRegex }
      ];
    } else if (query.customerName) {
      const nameRegex = new RegExp(query.customerName.trim(), 'i');
      filter.$or = [
        { 'customer.name': nameRegex },
        { customerName: nameRegex }
      ];
    } else if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { receiptNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex }
      ];
    }

    return Receipt.find(filter)
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
      cashReceived: rawCashReceived,
      customerName,
      customerPhone,
      customerEmail,
      customer: customerData,
      payment: paymentData,
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

    // Normalize payment info
    const finalPaymentMethod = (paymentData && paymentData.method) || paymentMethod || 'cash';
    const cashReceived = (paymentData && paymentData.cashReceived !== undefined)
      ? Number(paymentData.cashReceived)
      : (rawCashReceived !== undefined ? Number(rawCashReceived) : undefined);

    // Validate payment method and cash sufficiency
    receiptValidationService.validatePayment(finalPaymentMethod, totals.totalAmount, cashReceived);

    // Calculate cash change
    let changeGiven = 0;
    if (finalPaymentMethod === 'cash' && cashReceived !== undefined) {
      const changeCalc = calculateChange(totals.totalAmount, cashReceived);
      changeGiven = changeCalc.change;
    }

    const finalReceiptNumber = receiptNumber || await receiptNumberService.generateNextReceiptNumber(userId);

    // Customer normalization
    const customerObj = customerData || {};
    const finalCustomerName = (customerObj.name || customerName || '').trim();
    const finalCustomerPhone = (customerObj.phone || customerPhone || '').trim();
    const finalCustomerEmail = (customerObj.email || customerEmail || '').trim().toLowerCase();

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
      paymentMethod: finalPaymentMethod,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerEmail: finalCustomerEmail,
      customer: {
        name: finalCustomerName,
        phone: finalCustomerPhone,
        email: finalCustomerEmail,
        loyaltyNumber: (customerObj.loyaltyNumber || '').trim(),
        notes: (customerObj.notes || '').trim()
      },
      payment: {
        method: finalPaymentMethod,
        cashReceived: cashReceived || 0,
        changeGiven,
        reference: (paymentData && paymentData.reference ? paymentData.reference.trim() : '')
      },
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
    const paymentMethod = (updateData.payment && updateData.payment.method) || updateData.paymentMethod || receipt.paymentMethod;
    const cashReceived = (updateData.payment && updateData.payment.cashReceived !== undefined)
      ? updateData.payment.cashReceived
      : updateData.cashReceived;

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
    receiptValidationService.validatePayment(paymentMethod, totals.totalAmount, cashReceived);

    receipt.items = totals.items;
    receipt.subtotal = totals.subtotal;
    receipt.discount = totals.discount;
    receipt.taxRate = totals.taxRate;
    receipt.taxAmount = totals.taxAmount;
    receipt.totalAmount = totals.totalAmount;
    receipt.currency = totals.currency;
    receipt.paymentMethod = paymentMethod;

    if (updateData.status) receipt.status = updateData.status;

    // Update customer info
    if (updateData.customer || updateData.customerName !== undefined || updateData.customerPhone !== undefined || updateData.customerEmail !== undefined) {
      const c = updateData.customer || {};
      if (c.name !== undefined) receipt.customer.name = c.name.trim();
      else if (updateData.customerName !== undefined) receipt.customer.name = updateData.customerName.trim();
      receipt.customerName = receipt.customer.name;

      if (c.phone !== undefined) receipt.customer.phone = c.phone.trim();
      else if (updateData.customerPhone !== undefined) receipt.customer.phone = updateData.customerPhone.trim();
      receipt.customerPhone = receipt.customer.phone;

      if (c.email !== undefined) receipt.customer.email = c.email.trim().toLowerCase();
      else if (updateData.customerEmail !== undefined) receipt.customer.email = updateData.customerEmail.trim().toLowerCase();
      receipt.customerEmail = receipt.customer.email;

      if (c.loyaltyNumber !== undefined) receipt.customer.loyaltyNumber = c.loyaltyNumber.trim();
      if (c.notes !== undefined) receipt.customer.notes = c.notes.trim();
    }

    // Update payment info
    if (updateData.payment || cashReceived !== undefined) {
      receipt.payment.method = paymentMethod;
      if (cashReceived !== undefined) {
        receipt.payment.cashReceived = Number(cashReceived);
        if (paymentMethod === 'cash') {
          const changeCalc = calculateChange(totals.totalAmount, cashReceived);
          receipt.payment.changeGiven = changeCalc.change;
        }
      }
      if (updateData.payment && updateData.payment.reference !== undefined) {
        receipt.payment.reference = updateData.payment.reference.trim();
      }
    }

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
