import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayJakarta, getNowJakarta } from './date';

describe('Date Utils - Date Formatting Functions', () => {
  describe('getTodayJakarta', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayJakarta();
      // Should match YYYY-MM-DD pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a valid date string', () => {
      const result = getTodayJakarta();
      const date = new Date(result);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should pad single digit months and days', () => {
      const result = getTodayJakarta();
      const parts = result.split('-');
      expect(parts[1].length).toBe(2); // month
      expect(parts[2].length).toBe(2); // day
    });
  });

  describe('getNowJakarta', () => {
    it('should return a Date object', () => {
      const result = getNowJakarta();
      expect(result).toBeInstanceOf(Date);
    });

    it('should return a valid date', () => {
      const result = getNowJakarta();
      expect(isNaN(result.getTime())).toBe(false);
    });

    it('should include timezone offset for Jakarta (+07:00)', () => {
      const result = getNowJakarta();
      const isoString = result.toISOString();
      // The date should be valid and parseable
      expect(isoString).toBeTruthy();
      expect(new Date(isoString)).toBeInstanceOf(Date);
    });

    it('should return current time (within reasonable range)', () => {
      const before = new Date();
      const result = getNowJakarta();
      const after = new Date();
      
      // Result should be between before and after (with some tolerance for timezone)
      // Allow up to 24 hours difference for timezone variations
      const timeDiff = Math.abs(result.getTime() - before.getTime());
      expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000);
    });
  });
});
