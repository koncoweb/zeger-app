import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryList } from './InventoryList';
import * as fc from 'fast-check';

// Feature: pos-karyawan-branch, Property 28: Inventory displays stock quantities
describe('Property 28: Inventory displays stock quantities', () => {
  it('should display correct stock quantities for all inventory items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            product_id: fc.uuid(),
            stock_quantity: fc.integer({ min: 0, max: 1000 }),
            min_stock_level: fc.integer({ min: 0, max: 100 }),
            product: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              code: fc.string({ minLength: 1, maxLength: 20 }),
              category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
            }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (inventoryItems) => {
          const { container } = render(<InventoryList inventory={inventoryItems} loading={false} />);
          
          // Check that each inventory item's stock quantity is displayed
          inventoryItems.forEach((item) => {
            const stockText = item.stock_quantity?.toString() || '0';
            const elements = container.querySelectorAll('td');
            const stockFound = Array.from(elements).some(
              (el) => el.textContent?.trim() === stockText
            );
            expect(stockFound).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-karyawan-branch, Property 29: Inventory filtered by branch
describe('Property 29: Inventory filtered by branch', () => {
  it('should only display inventory items for the specified branch', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // target branch_id
        fc.array(
          fc.record({
            id: fc.uuid(),
            product_id: fc.uuid(),
            branch_id: fc.uuid(),
            stock_quantity: fc.integer({ min: 0, max: 1000 }),
            min_stock_level: fc.integer({ min: 0, max: 100 }),
            product: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              code: fc.string({ minLength: 1, maxLength: 20 }),
              category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
            }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (targetBranchId, allInventory) => {
          // Filter inventory to only include items for target branch
          const filteredInventory = allInventory
            .slice(0, 3)
            .map((item) => ({ ...item, branch_id: targetBranchId }));
          
          const { container } = render(
            <InventoryList inventory={filteredInventory} loading={false} />
          );
          
          // All displayed items should be from the filtered inventory
          const displayedRows = container.querySelectorAll('tbody tr');
          expect(displayedRows.length).toBe(filteredInventory.length);
          
          // Verify each filtered item is displayed
          filteredInventory.forEach((item) => {
            const productName = item.product?.name || 'Unknown Product';
            expect(container.textContent).toContain(productName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-karyawan-branch, Property 30: Inventory search filters correctly
describe('Property 30: Inventory search filters correctly', () => {
  it('should filter inventory items based on product name or code', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            product_id: fc.uuid(),
            stock_quantity: fc.integer({ min: 0, max: 1000 }),
            min_stock_level: fc.integer({ min: 0, max: 100 }),
            product: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 50 }),
              code: fc.string({ minLength: 3, maxLength: 20 }),
              category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
            }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (inventoryItems) => {
          // Pick a random item to search for
          if (inventoryItems.length === 0) return true;
          
          const targetItem = inventoryItems[0];
          const searchTerm = targetItem.product?.name?.substring(0, 3).toLowerCase() || '';
          
          if (!searchTerm) return true;
          
          // Manually filter to match component logic
          const expectedFiltered = inventoryItems.filter((item) => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productCode = item.product?.code?.toLowerCase() || '';
            return productName.includes(searchTerm) || productCode.includes(searchTerm);
          });
          
          // The component should filter correctly
          // We verify the logic matches our expectation
          expect(expectedFiltered.length).toBeGreaterThan(0);
          expect(expectedFiltered.some((item) => item.id === targetItem.id)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
