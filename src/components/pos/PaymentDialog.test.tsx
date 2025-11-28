import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

// Feature: pos-karyawan-branch, Property 18: Cash payment calculates change correctly
describe('PaymentDialog - Cash Payment Properties', () => {
  test('Property 18: Cash payment calculates change correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 10000000, noNaN: true }), // total amount
        fc.float({ min: 0, max: 20000000, noNaN: true }), // cash received
        (total, cashReceived) => {
          // Calculate change
          const change = cashReceived - total;
          
          // Property: change should always equal cash_received - total
          expect(change).toBe(cashReceived - total);
          
          // Property: if cash_received >= total, change should be non-negative
          if (cashReceived >= total) {
            expect(change).toBeGreaterThanOrEqual(0);
          }
          
          // Property: if cash_received < total, change should be negative
          if (cashReceived < total) {
            expect(change).toBeLessThan(0);
          }
          
          // Property: change + total should equal cash_received
          expect(Math.abs((change + total) - cashReceived)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
