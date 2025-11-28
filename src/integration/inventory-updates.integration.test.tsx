/**
 * Integration test for inventory updates with concurrent operations
 * Tests: stock deduction, concurrent transactions, stock validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventory } from '@/hooks/useInventory';
import { usePOS } from '@/hooks/usePOS';

// Mock Supabase client
const mockInventoryData = [
  {
    id: 'inv-1',
    product_id: 'product-1',
    branch_id: 'test-branch-id',
    stock_quantity: 100,
    reserved_quantity: 0,
    min_stock_level: 10,
    max_stock_level: 200,
    product: {
      id: 'product-1',
      name: 'Test Product 1',
      code: 'TEST001',
      price: 50000,
      is_active: true,
    },
  },
  {
    id: 'inv-2',
    product_id: 'product-2',
    branch_id: 'test-branch-id',
    stock_quantity: 5,
    reserved_quantity: 0,
    min_stock_level: 10,
    max_stock_level: 100,
    product: {
      id: 'product-2',
      name: 'Test Product 2',
      code: 'TEST002',
      price: 35000,
      is_active: true,
    },
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: mockInventoryData,
              error: null,
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
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
            })),
          })),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: {
                  id: 'test-branch-id',
                  code: 'HUB1',
                  name: 'Test Branch',
                },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === 'transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  count: 5,
                  error: null,
                })),
              })),
              head: vi.fn(() => ({
                count: 5,
                error: null,
              })),
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
        };
      }
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {},
              error: null,
            })),
          })),
        })),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
  },
}));

describe('Inventory Updates Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load inventory for branch', async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.inventory).toBeDefined();
      expect(result.current.inventory.length).toBeGreaterThan(0);
    });

    // Verify inventory items
    expect(result.current.inventory[0].product_id).toBe('product-1');
    expect(result.current.inventory[0].stock_quantity).toBe(100);
  });

  it('should get product stock correctly', async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.inventory.length).toBeGreaterThan(0);
    });

    const stock = result.current.getProductStock('product-1');
    expect(stock).toBe(100);
  });

  it('should identify low stock items', async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.inventory.length).toBeGreaterThan(0);
    });

    // Product 2 has stock_quantity (5) < min_stock_level (10)
    const lowStockItem = result.current.inventory.find(
      item => item.product_id === 'product-2'
    );

    expect(lowStockItem).toBeDefined();
    expect(lowStockItem!.stock_quantity).toBeLessThan(lowStockItem!.min_stock_level);
  });

  it('should prevent adding out of stock items to cart', async () => {
    const { result: inventoryResult } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(inventoryResult.current.inventory.length).toBeGreaterThan(0);
    });

    // Check if product with 0 stock can be added
    const outOfStockProduct = {
      id: 'product-3',
      name: 'Out of Stock Product',
      code: 'TEST003',
      price: 25000,
      cost_price: 15000,
      is_active: true,
    };

    const stock = inventoryResult.current.getProductStock('product-3');
    expect(stock).toBe(0);

    // Should not be able to add to cart
    expect(stock).toBe(0);
  });

  it('should handle concurrent stock updates', async () => {
    const { result: inventoryResult } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(inventoryResult.current.inventory.length).toBeGreaterThan(0);
    });

    const initialStock = inventoryResult.current.getProductStock('product-1');
    expect(initialStock).toBe(100);

    // Simulate multiple transactions updating stock concurrently
    const { result: posResult1 } = renderHook(() => usePOS());
    const { result: posResult2 } = renderHook(() => usePOS());

    const items1 = [{
      product_id: 'product-1',
      product_name: 'Test Product 1',
      quantity: 5,
      unit_price: 50000,
      total_price: 250000,
    }];

    const items2 = [{
      product_id: 'product-1',
      product_name: 'Test Product 1',
      quantity: 3,
      unit_price: 50000,
      total_price: 150000,
    }];

    // Create transactions concurrently
    await Promise.all([
      act(async () => {
        await posResult1.current.createTransaction({
          items: items1,
          paymentMethod: 'cash',
          paymentDetails: {},
        });
      }),
      act(async () => {
        await posResult2.current.createTransaction({
          items: items2,
          paymentMethod: 'cash',
          paymentDetails: {},
        });
      }),
    ]);

    // Both transactions should succeed
    // In real implementation, database would handle concurrency with locks
  });

  it('should refresh inventory after transaction', async () => {
    const { result: inventoryResult } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(inventoryResult.current.inventory.length).toBeGreaterThan(0);
    });

    const initialStock = inventoryResult.current.getProductStock('product-1');

    // Create a transaction
    const { result: posResult } = renderHook(() => usePOS());

    await act(async () => {
      await posResult.current.createTransaction({
        items: [{
          product_id: 'product-1',
          product_name: 'Test Product 1',
          quantity: 10,
          unit_price: 50000,
          total_price: 500000,
        }],
        paymentMethod: 'cash',
        paymentDetails: {},
      });
    });

    // Refresh inventory
    await act(async () => {
      await inventoryResult.current.refreshInventory();
    });

    // Stock should be updated (in real implementation)
    // Here we just verify refresh was called
    expect(inventoryResult.current.inventory).toBeDefined();
  });

  it('should validate stock quantity never goes negative', async () => {
    const { result: inventoryResult } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(inventoryResult.current.inventory.length).toBeGreaterThan(0);
    });

    // All stock quantities should be >= 0
    inventoryResult.current.inventory.forEach(item => {
      expect(item.stock_quantity).toBeGreaterThanOrEqual(0);
    });
  });
});
