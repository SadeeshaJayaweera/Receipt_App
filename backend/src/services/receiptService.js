const Receipt = require('../models/Receipt');
const receiptNumberService = require('./receiptNumberService');
const receiptValidationService = require('./receiptValidationService');
const { calculateReceiptTotals, calculateChange } = require('../utils/calcEngine');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class ReceiptService {
  async getAll(userId, query = {}) {
    const filter = { userId };

    if (query.status && ['draft', 'issued', 'voided'].includes(query.status)) {
      filter.status = query.status;
    }

    if (query.currency && ['LKR', 'USD'].includes(query.currency.toUpperCase())) {
      filter.currency = query.currency.toUpperCase();
    }

    if (query.paymentMethod && ['cash', 'card', 'mobile'].includes(query.paymentMethod.toLowerCase())) {
      const pm = query.paymentMethod.toLowerCase();
      filter.$or = [
        { 'payment.method': pm },
        { paymentMethod: pm }
      ];
    }

    // Date range filtering
    if (query.startDate || query.endDate) {
      const dateFilter = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          if (query.endDate.length <= 10) {
            end.setHours(23, 59, 59, 999);
          }
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }
    }

    // Amount range filtering
    const minVal = query.minAmount !== undefined ? query.minAmount : query.minTotal;
    const maxVal = query.maxAmount !== undefined ? query.maxAmount : query.maxTotal;
    if (minVal !== undefined || maxVal !== undefined) {
      const amountFilter = {};
      const min = Number(minVal);
      const max = Number(maxVal);
      if (!isNaN(min) && min >= 0) amountFilter.$gte = min;
      if (!isNaN(max) && max >= 0) amountFilter.$lte = max;
      if (Object.keys(amountFilter).length > 0) {
        filter.totalAmount = amountFilter;
      }
    }

    // Full text search or specific customer filters
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { receiptNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { notes: searchRegex },
        { 'items.flavourName': searchRegex }
      ];
    } else {
      if (query.customerPhone) {
        const phoneRegex = new RegExp(query.customerPhone.trim(), 'i');
        filter.$or = [
          { 'customer.phone': phoneRegex },
          { customerPhone: phoneRegex }
        ];
      }
      if (query.customerName) {
        const nameRegex = new RegExp(query.customerName.trim(), 'i');
        filter.$or = [
          { 'customer.name': nameRegex },
          { customerName: nameRegex }
        ];
      }
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'totalAmount', 'receiptNumber'];
    const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = (query.sortOrder === 'asc' || query.order === 'asc') ? 1 : -1;
    const sortCriteria = { [sortBy]: sortOrder };

    // Pagination
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const queryObj = Receipt.find(filter)
      .populate('items.flavourId')
      .sort(sortCriteria);

    const total = typeof Receipt.countDocuments === 'function'
      ? await Receipt.countDocuments(filter)
      : 0;

    if (query.paginate === 'false' || query.all === 'true') {
      const receipts = await queryObj;
      const safeList = Array.isArray(receipts) ? receipts : [];
      return {
        receipts: safeList,
        pagination: {
          total: safeList.length,
          page: 1,
          limit: safeList.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    let receipts;
    if (typeof queryObj.skip === 'function') {
      receipts = await queryObj.skip(skip).limit(limit);
    } else {
      receipts = await queryObj;
    }

    const safeReceipts = Array.isArray(receipts) ? receipts : [];
    const totalCount = total || safeReceipts.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      receipts: safeReceipts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
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
      statusHistory: [{
        fromStatus: 'none',
        toStatus: status || 'issued',
        changedAt: new Date(),
        reason: 'Initial creation',
        changedBy: userId
      }],
      notes: notes ? notes.trim() : undefined
    });

    return receipt.save();
  }

  async update(userId, receiptId, updateData) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    if (receipt.status === 'voided') {
      throw new BadRequestError('Cannot modify a voided receipt');
    }

    // Protect issued receipt financial immutability
    if (receipt.status === 'issued') {
      if (updateData.items || updateData.discount !== undefined || updateData.taxRate !== undefined || updateData.currency) {
        throw new BadRequestError('Issued receipts are financially immutable. Void the receipt and issue a new one to change items or pricing.');
      }
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

    if (updateData.status && updateData.status !== receipt.status) {
      receipt.statusHistory.push({
        fromStatus: receipt.status,
        toStatus: updateData.status,
        changedAt: new Date(),
        reason: 'Status updated via update',
        changedBy: userId
      });
      receipt.status = updateData.status;
    }

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

  async voidReceipt(userId, receiptId, reason) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A valid void reason (min 5 characters) is required');
    }

    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    if (receipt.status === 'voided') {
      throw new BadRequestError(`Receipt ${receipt.receiptNumber} is already voided`);
    }

    const previousStatus = receipt.status;
    const trimmedReason = reason.trim();

    receipt.status = 'voided';
    receipt.voidedAt = new Date();
    receipt.voidReason = trimmedReason;
    receipt.voidedBy = userId;

    if (!Array.isArray(receipt.statusHistory)) {
      receipt.statusHistory = [];
    }

    receipt.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: 'voided',
      changedAt: new Date(),
      reason: trimmedReason,
      changedBy: userId
    });

    return receipt.save();
  }

  async issueDraft(userId, receiptId) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    if (receipt.status === 'issued') {
      throw new BadRequestError('Receipt is already issued');
    }
    if (receipt.status === 'voided') {
      throw new BadRequestError('Cannot issue a voided receipt');
    }

    const previousStatus = receipt.status;
    receipt.status = 'issued';

    if (!Array.isArray(receipt.statusHistory)) {
      receipt.statusHistory = [];
    }

    receipt.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: 'issued',
      changedAt: new Date(),
      reason: 'Draft finalized and issued',
      changedBy: userId
    });

    return receipt.save();
  }

  async delete(userId, receiptId) {
    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }
    if (receipt.status === 'issued') {
      throw new BadRequestError('Issued receipts cannot be deleted for audit compliance. Void the receipt instead.');
    }
    await Receipt.findOneAndDelete({ _id: receiptId, userId });
    return { message: 'Receipt deleted successfully' };
  }
}

module.exports = new ReceiptService();
