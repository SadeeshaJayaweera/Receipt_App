/**
 * Authoritative Financial Calculation Engine
 * Handles monetary rounding, minor units conversion, discount logic,
 * tax computation, line-item subtotals, and currency formatting without
 * floating-point drift.
 */

/**
 * Perform exact half-up rounding to specified decimal places
 * (avoids 0.1 + 0.2 = 0.30000000000000004 issues)
 */
function round(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Convert monetary decimal to integer minor units (e.g. cents)
 */
function toMinorUnits(amount, decimals = 2) {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * (10 ** decimals));
}

/**
 * Convert integer minor units back to decimal currency
 */
function fromMinorUnits(minorUnits, decimals = 2) {
  if (typeof minorUnits !== 'number' || isNaN(minorUnits)) return 0;
  return round(minorUnits / (10 ** decimals), decimals);
}

/**
 * Calculate single receipt line item
 */
function calculateLineItem(item) {
  const quantity = Math.max(0, parseInt(item.quantity, 10) || 0);
  const price = Math.max(0, round(Number(item.price) || 0));
  
  // Calculate in minor units to prevent fractional cents accumulation
  const subtotalCents = toMinorUnits(price) * quantity;
  const subtotal = fromMinorUnits(subtotalCents);

  return {
    flavourId: item.flavourId,
    flavourName: (item.flavourName || '').trim(),
    quantity,
    price,
    subtotal
  };
}

/**
 * Calculate complete receipt totals including discount and tax
 */
function calculateReceiptTotals(options = {}) {
  const rawItems = Array.isArray(options.items) ? options.items : [];
  const normalizedItems = rawItems.map(calculateLineItem);

  // Sum line-item subtotals using integer minor units
  const subtotalCents = normalizedItems.reduce(
    (sum, item) => sum + toMinorUnits(item.subtotal),
    0
  );
  const subtotal = fromMinorUnits(subtotalCents);

  // Discount computation
  const discountType = options.discountType === 'percent' ? 'percent' : 'fixed';
  const rawDiscountValue = Math.max(0, Number(options.discount || options.discountValue) || 0);
  let discountCents = 0;

  if (discountType === 'percent') {
    const cappedPercent = Math.min(100, rawDiscountValue);
    discountCents = Math.round(subtotalCents * (cappedPercent / 100));
  } else {
    discountCents = Math.min(subtotalCents, toMinorUnits(rawDiscountValue));
  }
  const discount = fromMinorUnits(discountCents);

  // Taxable amount
  const taxableAmountCents = Math.max(0, subtotalCents - discountCents);
  const taxableAmount = fromMinorUnits(taxableAmountCents);

  // Tax computation (Off by default)
  const taxEnabled = Boolean(options.taxEnabled);
  const rawTaxRate = taxEnabled ? Math.max(0, Number(options.taxRate) || 0) : 0;
  const taxRate = Math.min(100, round(rawTaxRate));

  let taxAmountCents = 0;
  if (taxEnabled && taxRate > 0) {
    taxAmountCents = Math.round(taxableAmountCents * (taxRate / 100));
  }
  const taxAmount = fromMinorUnits(taxAmountCents);

  // Total amount = (Subtotal - Discount) + Tax
  const totalAmountCents = taxableAmountCents + taxAmountCents;
  const totalAmount = fromMinorUnits(totalAmountCents);

  return {
    items: normalizedItems,
    subtotal,
    discount,
    discountType,
    discountValue: rawDiscountValue,
    taxableAmount,
    taxEnabled,
    taxRate,
    taxAmount,
    totalAmount,
    currency: options.currency === 'USD' ? 'USD' : 'LKR'
  };
}

/**
 * Calculate change and balance for cash transactions
 */
function calculateChange(totalAmount, cashReceived) {
  const total = Math.max(0, round(Number(totalAmount) || 0));
  const received = Math.max(0, round(Number(cashReceived) || 0));

  const totalCents = toMinorUnits(total);
  const receivedCents = toMinorUnits(received);

  const diffCents = receivedCents - totalCents;
  const isSufficient = diffCents >= 0;

  return {
    totalAmount: total,
    cashReceived: received,
    isSufficient,
    change: isSufficient ? fromMinorUnits(diffCents) : 0,
    shortfall: isSufficient ? 0 : fromMinorUnits(-diffCents)
  };
}

/**
 * Format currency with standardized locale formatting
 */
function formatCurrency(amount, currency = 'LKR') {
  const numericAmount = round(Number(amount) || 0);
  const formattedNumber = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (currency === 'USD') {
    return `$${formattedNumber}`;
  }
  return `Rs. ${formattedNumber}`;
}

module.exports = {
  round,
  toMinorUnits,
  fromMinorUnits,
  calculateLineItem,
  calculateReceiptTotals,
  calculateChange,
  formatCurrency
};
