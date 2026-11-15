/**
 * Authoritative Financial Calculation Engine (Frontend ES Module)
 * Ensures 100% mathematical parity with backend calcEngine.js
 */

export function round(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toMinorUnits(amount, decimals = 2) {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * (10 ** decimals));
}

export function fromMinorUnits(minorUnits, decimals = 2) {
  if (typeof minorUnits !== 'number' || isNaN(minorUnits)) return 0;
  return round(minorUnits / (10 ** decimals), decimals);
}

export function calculateLineItem(item) {
  const quantity = Math.max(0, parseInt(item.quantity, 10) || 0);
  const price = Math.max(0, round(Number(item.price) || 0));
  
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

export function calculateReceiptTotals(options = {}) {
  const rawItems = Array.isArray(options.items) ? options.items : [];
  const normalizedItems = rawItems.map(calculateLineItem);

  const subtotalCents = normalizedItems.reduce(
    (sum, item) => sum + toMinorUnits(item.subtotal),
    0
  );
  const subtotal = fromMinorUnits(subtotalCents);

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

  const taxableAmountCents = Math.max(0, subtotalCents - discountCents);
  const taxableAmount = fromMinorUnits(taxableAmountCents);

  const taxEnabled = Boolean(options.taxEnabled);
  const rawTaxRate = taxEnabled ? Math.max(0, Number(options.taxRate) || 0) : 0;
  const taxRate = Math.min(100, round(rawTaxRate));

  let taxAmountCents = 0;
  if (taxEnabled && taxRate > 0) {
    taxAmountCents = Math.round(taxableAmountCents * (taxRate / 100));
  }
  const taxAmount = fromMinorUnits(taxAmountCents);

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

export function calculateChange(totalAmount, cashReceived) {
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

export const SUPPORTED_CURRENCIES = ['LKR', 'USD'];

export function isValidCurrency(code) {
  if (!code || typeof code !== 'string') return false;
  return SUPPORTED_CURRENCIES.includes(code.toUpperCase().trim());
}

export function getCurrencySymbol(currency = 'LKR') {
  const code = (currency || 'LKR').toUpperCase().trim();
  if (code === 'USD') return '$';
  return 'Rs.';
}

export function assertSameCurrency(currencyA, currencyB) {
  const a = (currencyA || 'LKR').toUpperCase().trim();
  const b = (currencyB || 'LKR').toUpperCase().trim();
  if (a !== b) {
    throw new Error(`Cannot perform financial calculation across different currencies (${a} and ${b}) without conversion.`);
  }
}

export function formatCurrency(amount, currency = 'LKR', options = {}) {
  const code = (currency || 'LKR').toUpperCase().trim();
  const numericAmount = round(Number(amount) || 0);
  const formattedNumber = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const symbol = getCurrencySymbol(code);

  if (options.format === 'code') {
    return `${code} ${formattedNumber}`;
  }
  if (options.format === 'both') {
    return `${code} ${symbol}${code === 'USD' ? '' : ' '}${formattedNumber}`;
  }

  if (code === 'USD') {
    return `$${formattedNumber}`;
  }
  return `Rs. ${formattedNumber}`;
}
