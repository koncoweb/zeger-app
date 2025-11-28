import { describe, it, expect } from 'vitest';
import { formatDate, normalizePaymentMethod, calculateNetProfit } from './financial-utils';
import type { RevenueBreakdown, ExpenseBreakdown } from './financial-utils';

describe('Financial Utils - Calculation Functions', () => {
  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should pad single digit months and days with zero', () => {
      const date = new Date('2024-03-05T10:30:00');
      expect(formatDate(date)).toBe('2024-03-05');
    });

    it('should handle end of year dates', () => {
      const date = new Date('2024-12-31T23:59:59');
      expect(formatDate(date)).toBe('2024-12-31');
    });
  });

  describe('normalizePaymentMethod', () => {
    it('should normalize bank_transfer to transfer', () => {
      expect(normalizePaymentMethod('bank_transfer')).toBe('transfer');
    });

    it('should normalize bank to transfer', () => {
      expect(normalizePaymentMethod('bank')).toBe('transfer');
    });

    it('should normalize BANK_TRANSFER (uppercase) to transfer', () => {
      expect(normalizePaymentMethod('BANK_TRANSFER')).toBe('transfer');
    });

    it('should return cash as is', () => {
      expect(normalizePaymentMethod('cash')).toBe('cash');
    });

    it('should return qris as is', () => {
      expect(normalizePaymentMethod('qris')).toBe('qris');
    });

    it('should handle empty string', () => {
      expect(normalizePaymentMethod('')).toBe('');
    });

    it('should handle null/undefined by converting to empty string', () => {
      expect(normalizePaymentMethod(null as any)).toBe('');
    });
  });

  describe('calculateNetProfit', () => {
    it('should calculate net profit correctly with all positive values', () => {
      const revenue: RevenueBreakdown = {
        cash: 1000000,
        qris: 500000,
        transfer: 300000,
        mdr: 3500, // 0.7% of QRIS
      };

      const rawMaterialCost = 600000;

      const expenses: ExpenseBreakdown = {
        rawMaterial: 0,
        operationalDaily: 100000,
        salary: 200000,
        rent: 150000,
        household: 50000,
        environment: 30000,
        other: 20000,
        marketing: 10000,
        administration: 5000,
        depreciation: 0,
        interest: 0,
        tax: 0,
      };

      // Total revenue = 1,800,000
      // Gross profit = 1,800,000 - 3,500 = 1,796,500
      // Total expenses = 600,000 + 565,000 = 1,165,000
      // Net profit = 1,796,500 - 1,165,000 = 631,500
      const netProfit = calculateNetProfit(revenue, rawMaterialCost, expenses);
      expect(netProfit).toBe(631500);
    });

    it('should handle zero revenue', () => {
      const revenue: RevenueBreakdown = {
        cash: 0,
        qris: 0,
        transfer: 0,
        mdr: 0,
      };

      const rawMaterialCost = 100000;

      const expenses: ExpenseBreakdown = {
        rawMaterial: 0,
        operationalDaily: 50000,
        salary: 0,
        rent: 0,
        household: 0,
        environment: 0,
        other: 0,
        marketing: 0,
        administration: 0,
        depreciation: 0,
        interest: 0,
        tax: 0,
      };

      // Net profit should be negative (loss)
      const netProfit = calculateNetProfit(revenue, rawMaterialCost, expenses);
      expect(netProfit).toBe(-150000);
    });

    it('should handle zero expenses', () => {
      const revenue: RevenueBreakdown = {
        cash: 500000,
        qris: 0,
        transfer: 0,
        mdr: 0,
      };

      const rawMaterialCost = 0;

      const expenses: ExpenseBreakdown = {
        rawMaterial: 0,
        operationalDaily: 0,
        salary: 0,
        rent: 0,
        household: 0,
        environment: 0,
        other: 0,
        marketing: 0,
        administration: 0,
        depreciation: 0,
        interest: 0,
        tax: 0,
      };

      const netProfit = calculateNetProfit(revenue, rawMaterialCost, expenses);
      expect(netProfit).toBe(500000);
    });

    it('should calculate correctly with MDR deduction', () => {
      const revenue: RevenueBreakdown = {
        cash: 0,
        qris: 1000000,
        transfer: 0,
        mdr: 7000, // 0.7% of 1,000,000
      };

      const rawMaterialCost = 400000;

      const expenses: ExpenseBreakdown = {
        rawMaterial: 0,
        operationalDaily: 100000,
        salary: 0,
        rent: 0,
        household: 0,
        environment: 0,
        other: 0,
        marketing: 0,
        administration: 0,
        depreciation: 0,
        interest: 0,
        tax: 0,
      };

      // Gross profit = 1,000,000 - 7,000 = 993,000
      // Net profit = 993,000 - 400,000 - 100,000 = 493,000
      const netProfit = calculateNetProfit(revenue, rawMaterialCost, expenses);
      expect(netProfit).toBe(493000);
    });
  });
});
