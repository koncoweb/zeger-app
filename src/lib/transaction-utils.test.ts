import { describe, it, expect } from 'vitest';
import {
  validateTransactionNumber,
  parseTransactionNumber,
  formatTransactionNumber,
  calculateChange,
  calculateDiscountAmount,
  calculateFinalAmount,
  calculateItemTotal,
  calculateCartSubtotal,
} from './transaction-utils';

describe('Transaction Utils', () => {
  describe('validateTransactionNumber', () => {
    it('should validate correct transaction number format', () => {
      expect(validateTransactionNumber('ZEG-HUB1-20240115-0001')).toBe(true);
      expect(validateTransactionNumber('ZEG-SB2-20240315-0123')).toBe(true);
      expect(validateTransactionNumber('ZEG-TEST-20241231-9999')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateTransactionNumber('ZEG-HUB1-20240115-001')).toBe(false); // 3 digits
      expect(validateTransactionNumber('ZEG-HUB1-2024115-0001')).toBe(false); // 7 digits date
      expect(validateTransactionNumber('ZEG-HUB1-20240115-00001')).toBe(false); // 5 digits
      expect(validateTransactionNumber('ZEGER-HUB1-20240115-0001')).toBe(false); // wrong prefix
      expect(validateTransactionNumber('ZEG-HUB1-20240115')).toBe(false); // missing sequence
      expect(validateTransactionNumber('')).toBe(false);
    });
  });

  describe('parseTransactionNumber', () => {
    it('should parse valid transaction number', () => {
      const result = parseTransactionNumber('ZEG-HUB1-20240115-0001');
      expect(result).toEqual({
        branchCode: 'HUB1',
        date: '20240115',
        sequence: '0001',
      });
    });

    it('should return null for invalid transaction number', () => {
      expect(parseTransactionNumber('INVALID')).toBeNull();
      expect(parseTransactionNumber('ZEG-HUB1-2024115-0001')).toBeNull();
    });
  });

  describe('formatTransactionNumber', () => {
    it('should format transaction number correctly', () => {
      expect(formatTransactionNumber('HUB1', '20240115', 1)).toBe('ZEG-HUB1-20240115-0001');
      expect(formatTransactionNumber('SB2', '20240315', 123)).toBe('ZEG-SB2-20240315-0123');
      expect(formatTransactionNumber('TEST', '20241231', 9999)).toBe('ZEG-TEST-20241231-9999');
    });

    it('should pad sequence with zeros', () => {
      expect(formatTransactionNumber('HUB1', '20240115', 1)).toBe('ZEG-HUB1-20240115-0001');
      expect(formatTransactionNumber('HUB1', '20240115', 10)).toBe('ZEG-HUB1-20240115-0010');
      expect(formatTransactionNumber('HUB1', '20240115', 100)).toBe('ZEG-HUB1-20240115-0100');
    });
  });

  describe('calculateChange', () => {
    it('should calculate change correctly', () => {
      expect(calculateChange(100000, 75000)).toBe(25000);
      expect(calculateChange(50000, 45000)).toBe(5000);
      expect(calculateChange(200000, 150000)).toBe(50000);
    });

    it('should return 0 when amount received is less than total', () => {
      expect(calculateChange(50000, 75000)).toBe(0);
      expect(calculateChange(0, 100000)).toBe(0);
    });

    it('should return 0 when amount received equals total', () => {
      expect(calculateChange(100000, 100000)).toBe(0);
    });

    it('should handle decimal amounts', () => {
      expect(calculateChange(100000.50, 75000.25)).toBe(25000.25);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate discount amount from percentage', () => {
      expect(calculateDiscountAmount(100000, 10)).toBe(10000);
      expect(calculateDiscountAmount(50000, 20)).toBe(10000);
      expect(calculateDiscountAmount(200000, 5)).toBe(10000);
    });

    it('should return 0 for 0% discount', () => {
      expect(calculateDiscountAmount(100000, 0)).toBe(0);
    });

    it('should return full amount for 100% discount', () => {
      expect(calculateDiscountAmount(100000, 100)).toBe(100000);
    });

    it('should return 0 for invalid discount percentages', () => {
      expect(calculateDiscountAmount(100000, -10)).toBe(0);
      expect(calculateDiscountAmount(100000, 150)).toBe(0);
    });

    it('should handle decimal percentages', () => {
      expect(calculateDiscountAmount(100000, 7.5)).toBe(7500);
      expect(calculateDiscountAmount(50000, 12.5)).toBe(6250);
    });
  });

  describe('calculateFinalAmount', () => {
    it('should calculate final amount after discount', () => {
      expect(calculateFinalAmount(100000, 10000)).toBe(90000);
      expect(calculateFinalAmount(50000, 5000)).toBe(45000);
      expect(calculateFinalAmount(200000, 50000)).toBe(150000);
    });

    it('should return 0 when discount exceeds subtotal', () => {
      expect(calculateFinalAmount(100000, 150000)).toBe(0);
    });

    it('should return subtotal when discount is 0', () => {
      expect(calculateFinalAmount(100000, 0)).toBe(100000);
    });

    it('should handle decimal amounts', () => {
      expect(calculateFinalAmount(100000.50, 10000.25)).toBe(90000.25);
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate item total correctly', () => {
      expect(calculateItemTotal(2, 50000)).toBe(100000);
      expect(calculateItemTotal(5, 10000)).toBe(50000);
      expect(calculateItemTotal(1, 75000)).toBe(75000);
    });

    it('should return 0 for zero quantity', () => {
      expect(calculateItemTotal(0, 50000)).toBe(0);
    });

    it('should return 0 for zero price', () => {
      expect(calculateItemTotal(5, 0)).toBe(0);
    });

    it('should return 0 for negative values', () => {
      expect(calculateItemTotal(-2, 50000)).toBe(0);
      expect(calculateItemTotal(2, -50000)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(calculateItemTotal(2.5, 10000)).toBe(25000);
      expect(calculateItemTotal(3, 15000.50)).toBe(45001.5);
    });
  });

  describe('calculateCartSubtotal', () => {
    it('should calculate cart subtotal from items', () => {
      const items = [
        { quantity: 2, unit_price: 50000 },
        { quantity: 1, unit_price: 30000 },
        { quantity: 3, unit_price: 15000 },
      ];
      expect(calculateCartSubtotal(items)).toBe(175000);
    });

    it('should return 0 for empty cart', () => {
      expect(calculateCartSubtotal([])).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ quantity: 2, unit_price: 50000 }];
      expect(calculateCartSubtotal(items)).toBe(100000);
    });

    it('should ignore items with zero quantity or price', () => {
      const items = [
        { quantity: 2, unit_price: 50000 },
        { quantity: 0, unit_price: 30000 },
        { quantity: 3, unit_price: 0 },
      ];
      expect(calculateCartSubtotal(items)).toBe(100000);
    });

    it('should handle decimal values', () => {
      const items = [
        { quantity: 2.5, unit_price: 10000 },
        { quantity: 1, unit_price: 15000.50 },
      ];
      expect(calculateCartSubtotal(items)).toBe(40000.5);
    });
  });
});
