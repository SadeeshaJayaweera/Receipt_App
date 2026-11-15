const { BadRequestError } = require('../errors/AppError');
const { round, toMinorUnits } = require('../utils/calcEngine');

const MAX_LINE_ITEMS = 100;
const MAX_ITEM_QUANTITY = 1000;
const MAX_ITEM_PRICE = 1000000;
const MAX_TOTAL_AMOUNT = 50000000;

class ReceiptValidationService {
  /**
   * Validates and normalizes receipt line items, merging duplicate flavours
   */
  validateAndNormalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Receipt must contain at least one line item');
    }

    if (items.length > MAX_LINE_ITEMS) {
      throw new BadRequestError(`Receipt cannot contain more than ${MAX_LINE_ITEMS} items`);
    }

    const mergedMap = new Map();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = (item.flavourName || '').trim();
      if (!name) {
        throw new BadRequestError(`Line item at index ${i} is missing a flavour name`);
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        throw new BadRequestError(`Line item "${name}" must have a positive integer quantity (received ${item.quantity})`);
      }
      if (quantity > MAX_ITEM_QUANTITY) {
        throw new BadRequestError(`Quantity for "${name}" cannot exceed ${MAX_ITEM_QUANTITY}`);
      }

      const price = Number(item.price);
      if (isNaN(price) || price < 0) {
        throw new BadRequestError(`Price for "${name}" cannot be negative`);
      }
      if (price > MAX_ITEM_PRICE) {
        throw new BadRequestError(`Price for "${name}" cannot exceed ${MAX_ITEM_PRICE}`);
      }

      // POS duplicate merge key: combine by flavourId or (name + unit price)
      const mergeKey = item.flavourId
        ? `id:${item.flavourId}:${round(price)}`
        : `name:${name.toLowerCase()}:${round(price)}`;

      if (mergedMap.has(mergeKey)) {
        const existing = mergedMap.get(mergeKey);
        const combinedQty = existing.quantity + quantity;
        if (combinedQty > MAX_ITEM_QUANTITY) {
          throw new BadRequestError(`Combined quantity for "${name}" cannot exceed ${MAX_ITEM_QUANTITY}`);
        }
        existing.quantity = combinedQty;
        existing.subtotal = round(existing.quantity * existing.price);
      } else {
        mergedMap.set(mergeKey, {
          flavourId: item.flavourId || undefined,
          flavourName: name,
          quantity,
          price: round(price),
          subtotal: round(quantity * price)
        });
      }
    }

    return Array.from(mergedMap.values());
  }

  /**
   * Validates discount bounds against order subtotal
   */
  validateDiscount(discount, discountType, subtotal) {
    const type = discountType === 'percent' ? 'percent' : 'fixed';
    const value = Number(discount) || 0;

    if (value < 0) {
      throw new BadRequestError('Discount value cannot be negative');
    }

    if (type === 'percent' && value > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    if (type === 'fixed' && value > subtotal) {
      throw new BadRequestError(`Fixed discount (${value}) cannot exceed order subtotal (${subtotal})`);
    }
  }

  /**
   * Validates tax rate and configuration
   */
  validateTax(taxEnabled, taxRate) {
    if (taxEnabled) {
      const rate = Number(taxRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new BadRequestError('Tax rate must be between 0% and 100%');
      }
    }
  }

  /**
   * Validates maximum allowed financial bounds to prevent arithmetic overflows
   */
  validateFinancialBounds(subtotal, totalAmount) {
    if (subtotal > MAX_TOTAL_AMOUNT) {
      throw new BadRequestError(`Order subtotal cannot exceed ${MAX_TOTAL_AMOUNT}`);
    }
    if (totalAmount > MAX_TOTAL_AMOUNT) {
      throw new BadRequestError(`Order total cannot exceed ${MAX_TOTAL_AMOUNT}`);
    }
  }

  /**
   * Validates payment method and cash sufficiency
   */
  validatePayment(paymentMethod, totalAmount, cashReceived) {
    const validMethods = ['cash', 'card', 'mobile'];
    if (!validMethods.includes(paymentMethod)) {
      throw new BadRequestError(`Invalid payment method "${paymentMethod}". Allowed: ${validMethods.join(', ')}`);
    }

    if (paymentMethod === 'cash' && cashReceived !== undefined && cashReceived !== null) {
      const cash = Number(cashReceived);
      if (isNaN(cash) || cash < 0) {
        throw new BadRequestError('Cash received must be a non-negative number');
      }
      if (cash < totalAmount) {
        throw new BadRequestError(`Cash received (${cash}) is insufficient for total amount (${totalAmount})`);
      }
    }
  }
}

module.exports = new ReceiptValidationService();
