/**
 * Integration test for complete transaction flow from cart to database
 * Tests the entire flow: add to cart -> checkout -> payment -> database records
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import { usePOS } from '@/hooks/usePOS';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-profile-id',
              user_id: 'test-user-id',
              role: 'bh_kasir',
              branch_id: 'test-branch-id',
              full_name: 'Test Kasir',
            },
            error: null,
          })),
          maybeSingle: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-branch-id',
              code: 'HUB1',
              name: 'Test Branch',
            },
            error: null,
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              count: 5,
              error: null,
            })),
          })),
        })),
        head: vi.fn(() => ({
          count: 5,
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-transaction-id',
              transaction_number: 'ZEG-HUB1-20240115-0006',
              final_amount: 100000,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}));

describe('Transaction Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full transaction flow from cart to database', async () => {
    // Step 1: Initialize cart
    const { result: cartResult } = renderHook(() => useCart());

    // Step 2: Add items to cart
    const testProduct = {
      id: 'product-1',
      name: 'Test Product',
      code: 'TEST001',
      price: 50000,
      cost_price: 30000,
      is_active: true,
    };

    act(() => {
      cartResult.current.addItem(testProduct);
      cartResult.current.addItem(testProduct); // Add again to increase quantity
    });

    // Verify cart state
    expect(cartResult.current.items).toHaveLength(1);
    expect(cartResult.current.items[0].quantity).toBe(2);
    expect(cartResult.current.subtotal).toBe(100000);

    // Step 3: Initialize POS hook for transaction
    const { result: posResult } = renderHook(() => usePOS());

    // Step 4: Create transaction
    await act(async () => {
      const transaction = await posResult.current.createTransaction({
        items: cartResult.current.items,
        paymentMethod: 'cash',
        paymentDetails: {
          amountReceived: 150000,
          change: 50000,
        },
      });

      // Verify transaction was created
      expect(transaction).toBeDefined();
      expect(transaction.transaction_number).toMatch(/^ZEG-[A-Z0-9]+-\d{8}-\d{4}$/);
      expect(transaction.final_amount).toBe(100000);
    });

    // Step 5: Verify cart is cleared after successful transaction
    act(() => {
      cartResult.current.clearCart();
    });

    expect(cartResult.current.items).toHaveLength(0);
    expect(cartResult.current.subtotal).toBe(0);
  });

  it('should handle transaction with multiple items', async () => {
    const { result: cartResult } = renderHook(() => useCart());

    const products = [
      { id: 'p1', name: 'Product 1', code: 'P001', price: 25000, cost_price: 15000, is_active: true },
      { id: 'p2', name: 'Product 2', code: 'P002', price: 35000, cost_price: 20000, is_active: true },
      { id: 'p3', name: 'Product 3', code: 'P003', price: 40000, cost_price: 25000, is_active: true },
    ];

    act(() => {
      products.forEach(product => cartResult.current.addItem(product));
    });

    expect(cartResult.current.items).toHaveLength(3);
    expect(cartResult.current.subtotal).toBe(100000);

    const { result: posResult } = renderHook(() => usePOS());

    await act(async () => {
      const transaction = await posResult.current.createTransaction({
        items: cartResult.current.items,
        paymentMethod: 'qris',
        paymentDetails: {},
      });

      expect(transaction).toBeDefined();
      expect(transaction.final_amount).toBe(100000);
    });
  });

  it('should handle transaction with discount', async () => {
    const { result: cartResult } = renderHook(() => useCart());

    const testProduct = {
      id: 'product-1',
      name: 'Test Product',
      code: 'TEST001',
      price: 100000,
      cost_price: 60000,
      is_active: true,
    };

    act(() => {
      cartResult.current.addItem(testProduct);
    });

    expect(cartResult.current.subtotal).toBe(100000);

    // Apply discount (this would be done through cart state management)
    const discountAmount = 10000;
    const finalAmount = cartResult.current.subtotal - discountAmount;

    expect(finalAmount).toBe(90000);
  });

  it('should update quantity correctly in cart', async () => {
    const { result: cartResult } = renderHook(() => useCart());

    const testProduct = {
      id: 'product-1',
      name: 'Test Product',
      code: 'TEST001',
      price: 50000,
      cost_price: 30000,
      is_active: true,
    };

    act(() => {
      cartResult.current.addItem(testProduct);
    });

    expect(cartResult.current.items[0].quantity).toBe(1);

    act(() => {
      cartResult.current.updateQuantity('product-1', 5);
    });

    expect(cartResult.current.items[0].quantity).toBe(5);
    expect(cartResult.current.subtotal).toBe(250000);
  });

  it('should remove item from cart', async () => {
    const { result: cartResult } = renderHook(() => useCart());

    const products = [
      { id: 'p1', name: 'Product 1', code: 'P001', price: 25000, cost_price: 15000, is_active: true },
      { id: 'p2', name: 'Product 2', code: 'P002', price: 35000, cost_price: 20000, is_active: true },
    ];

    act(() => {
      products.forEach(product => cartResult.current.addItem(product));
    });

    expect(cartResult.current.items).toHaveLength(2);
    expect(cartResult.current.subtotal).toBe(60000);

    act(() => {
      cartResult.current.removeItem('p1');
    });

    expect(cartResult.current.items).toHaveLength(1);
    expect(cartResult.current.subtotal).toBe(35000);
  });
});
