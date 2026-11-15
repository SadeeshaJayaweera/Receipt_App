import { describe, it, expect } from 'vitest';
import {
  round,
  toMinorUnits,
  fromMinorUnits,
  calculateLineItem,
  calculateReceiptTotals,
  calculateChange,
  formatCurrency
} from './calcEngine';

describe('Frontend Calc Engine Parity Tests', () => {
  it('correctly rounds decimals without float drift', () => {
    expect(round(0.1 + 0.2, 2)).toBe(0.3);
    expect(toMinorUnits(15.75)).toBe(1575);
    expect(fromMinorUnits(1575)).toBe(15.75);
  });

  it('calculates totals identically to backend', () => {
    const res = calculateReceiptTotals({
      items: [
        { flavourName: 'Lime Juice', quantity: 2, price: 150 },
        { flavourName: 'Watermelon', quantity: 1, price: 200 }
      ],
      discount: 50,
      taxEnabled: true,
      taxRate: 10,
      currency: 'LKR'
    });

    expect(res.subtotal).toBe(500);
    expect(res.discount).toBe(50);
    expect(res.taxableAmount).toBe(450);
    expect(res.taxAmount).toBe(45);
    expect(res.totalAmount).toBe(495);
    expect(formatCurrency(res.totalAmount, 'LKR')).toBe('Rs. 495.00');
  });

  it('calculates cash change', () => {
    const change = calculateChange(450, 500);
    expect(change.isSufficient).toBe(true);
    expect(change.change).toBe(50);
  });

  it('formats currency with code and symbol formats across LKR and USD', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
    expect(formatCurrency(100, 'LKR')).toBe('Rs. 100.00');
    expect(formatCurrency(100, 'USD', { format: 'code' })).toBe('USD 100.00');
    expect(formatCurrency(100, 'LKR', { format: 'code' })).toBe('LKR 100.00');
  });
});
