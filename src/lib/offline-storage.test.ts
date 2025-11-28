import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  saveOfflineTransaction,
  getOfflineTransactions,
  removeOfflineTransaction,
  clearOfflineTransactions,
  getPendingTransactionCount,
  generateOfflineTransactionId,
  OfflineTransaction,
} from './offline-storage';

describe('Offline Storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  // Feature: pos-karyawan-branch, Property 47: Offline transactions stored locally
  it('should store offline transactions in local storage', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            items: fc.array(
              fc.record({
                product_id: fc.uuid(),
                product_name: fc.string({ minLength: 1, maxLength: 50 }),
                quantity: fc.integer({ min: 1, max: 100 }),
                unit_price: fc.float({ min: 1, max: 1000000, noNaN: true }),
                total_price: fc.float({ min: 1, max: 1000000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            paymentMethod: fc.constantFrom('cash', 'qris', 'transfer'),
            totalAmount: fc.float({ min: 1, max: 10000000, noNaN: true }),
            discountAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
            finalAmount: fc.float({ min: 1, max: 10000000, noNaN: true }),
            branchId: fc.uuid(),
            userId: fc.uuid(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (transactionData) => {
          // Clear storage before test
          clearOfflineTransactions();

          // Save each transaction
          const savedTransactions: OfflineTransaction[] = [];
          for (const data of transactionData) {
            const transaction: OfflineTransaction = {
              id: generateOfflineTransactionId(),
              items: data.items,
              paymentMethod: data.paymentMethod,
              totalAmount: data.totalAmount,
              discountAmount: data.discountAmount,
              finalAmount: data.finalAmount,
              branchId: data.branchId,
              userId: data.userId,
              timestamp: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
            };

            saveOfflineTransaction(transaction);
            savedTransactions.push(transaction);
          }

          // Retrieve transactions
          const retrieved = getOfflineTransactions();

          // Verify count matches
          expect(retrieved.length).toBe(savedTransactions.length);

          // Verify each transaction is stored correctly
          for (let i = 0; i < savedTransactions.length; i++) {
            const saved = savedTransactions[i];
            const found = retrieved.find((t) => t.id === saved.id);

            expect(found).toBeDefined();
            expect(found?.items.length).toBe(saved.items.length);
            expect(found?.paymentMethod).toBe(saved.paymentMethod);
            expect(found?.totalAmount).toBe(saved.totalAmount);
            expect(found?.branchId).toBe(saved.branchId);
            expect(found?.status).toBe('pending');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove offline transactions after sync', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            items: fc.array(
              fc.record({
                product_id: fc.uuid(),
                product_name: fc.string({ minLength: 1, maxLength: 50 }),
                quantity: fc.integer({ min: 1, max: 100 }),
                unit_price: fc.float({ min: 1, max: 1000000, noNaN: true }),
                total_price: fc.float({ min: 1, max: 1000000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            paymentMethod: fc.constantFrom('cash', 'qris', 'transfer'),
            totalAmount: fc.float({ min: 1, max: 10000000, noNaN: true }),
            branchId: fc.uuid(),
            userId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (transactionData) => {
          // Clear storage
          clearOfflineTransactions();

          // Save transactions
          const savedIds: string[] = [];
          for (const data of transactionData) {
            const transaction: OfflineTransaction = {
              id: generateOfflineTransactionId(),
              items: data.items,
              paymentMethod: data.paymentMethod,
              totalAmount: data.totalAmount,
              discountAmount: 0,
              finalAmount: data.totalAmount,
              branchId: data.branchId,
              userId: data.userId,
              timestamp: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
            };

            saveOfflineTransaction(transaction);
            savedIds.push(transaction.id);
          }

          const initialCount = getOfflineTransactions().length;
          expect(initialCount).toBe(savedIds.length);

          // Remove first transaction
          removeOfflineTransaction(savedIds[0]);

          // Verify count decreased
          const afterRemoval = getOfflineTransactions();
          expect(afterRemoval.length).toBe(initialCount - 1);

          // Verify the removed transaction is not in storage
          const removedTransaction = afterRemoval.find((t) => t.id === savedIds[0]);
          expect(removedTransaction).toBeUndefined();

          // Verify other transactions are still there
          for (let i = 1; i < savedIds.length; i++) {
            const found = afterRemoval.find((t) => t.id === savedIds[i]);
            expect(found).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly count pending transactions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (pendingCount, syncingCount) => {
          clearOfflineTransactions();

          // Create pending transactions
          for (let i = 0; i < pendingCount; i++) {
            const transaction: OfflineTransaction = {
              id: generateOfflineTransactionId(),
              items: [
                {
                  product_id: 'test-id',
                  product_name: 'Test Product',
                  quantity: 1,
                  unit_price: 100,
                  total_price: 100,
                },
              ],
              paymentMethod: 'cash',
              totalAmount: 100,
              discountAmount: 0,
              finalAmount: 100,
              branchId: 'test-branch',
              userId: 'test-user',
              timestamp: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
            };
            saveOfflineTransaction(transaction);
          }

          // Create syncing transactions
          for (let i = 0; i < syncingCount; i++) {
            const transaction: OfflineTransaction = {
              id: generateOfflineTransactionId(),
              items: [
                {
                  product_id: 'test-id',
                  product_name: 'Test Product',
                  quantity: 1,
                  unit_price: 100,
                  total_price: 100,
                },
              ],
              paymentMethod: 'cash',
              totalAmount: 100,
              discountAmount: 0,
              finalAmount: 100,
              branchId: 'test-branch',
              userId: 'test-user',
              timestamp: new Date().toISOString(),
              status: 'syncing',
              retryCount: 0,
            };
            saveOfflineTransaction(transaction);
          }

          const count = getPendingTransactionCount();
          expect(count).toBe(pendingCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique transaction IDs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (count) => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            const id = generateOfflineTransactionId();
            expect(id).toMatch(/^offline_\d+_[a-z0-9]+$/);
            ids.add(id);
          }

          // All IDs should be unique
          expect(ids.size).toBe(count);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear all offline transactions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          clearOfflineTransactions();

          // Add transactions
          for (let i = 0; i < count; i++) {
            const transaction: OfflineTransaction = {
              id: generateOfflineTransactionId(),
              items: [
                {
                  product_id: 'test-id',
                  product_name: 'Test Product',
                  quantity: 1,
                  unit_price: 100,
                  total_price: 100,
                },
              ],
              paymentMethod: 'cash',
              totalAmount: 100,
              discountAmount: 0,
              finalAmount: 100,
              branchId: 'test-branch',
              userId: 'test-user',
              timestamp: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
            };
            saveOfflineTransaction(transaction);
          }

          // Verify transactions exist
          expect(getOfflineTransactions().length).toBe(count);

          // Clear all
          clearOfflineTransactions();

          // Verify all cleared
          expect(getOfflineTransactions().length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
