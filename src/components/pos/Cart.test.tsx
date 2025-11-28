import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Cart } from './Cart';
import { CartItem } from '@/lib/types';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Feature: pos-karyawan-branch, Property 17: Checkout opens payment dialog
describe('Cart Checkout Properties', () => {
  it('Property 17: Checkout opens payment dialog', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Generate array of cart items
        fc.array(
          fc.record({
            product_id: fc.uuid(),
            product_name: fc.string({ minLength: 1, maxLength: 50 }),
            product_code: fc.string({ minLength: 1, maxLength: 20 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            unit_price: fc.float({ min: 1000, max: 1000000 }),
            total_price: fc.float({ min: 1000, max: 10000000 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (items: CartItem[]) => {
          // Calculate totals
          const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
          const discount = 0;
          const total = subtotal - discount;

          // Mock checkout handler
          const mockOnCheckout = vi.fn();
          const mockOnUpdateQuantity = vi.fn();
          const mockOnRemoveItem = vi.fn();

          // Render Cart component
          const { unmount } = render(
            <Cart
              items={items}
              onUpdateQuantity={mockOnUpdateQuantity}
              onRemoveItem={mockOnRemoveItem}
              onCheckout={mockOnCheckout}
              subtotal={subtotal}
              discount={discount}
              total={total}
            />
          );

          // Find and click checkout button
          const checkoutButton = screen.getByRole('button', { name: /checkout/i });
          expect(checkoutButton).toBeDefined();

          // Click checkout button
          fireEvent.click(checkoutButton);

          // Property: Clicking checkout should call onCheckout handler
          expect(mockOnCheckout).toHaveBeenCalledTimes(1);

          // Clean up after each iteration
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 17: Checkout button is present for non-empty cart', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Generate at least one cart item
        fc.array(
          fc.record({
            product_id: fc.uuid(),
            product_name: fc.string({ minLength: 1, maxLength: 50 }),
            product_code: fc.string({ minLength: 1, maxLength: 20 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            unit_price: fc.float({ min: 1000, max: 1000000 }),
            total_price: fc.float({ min: 1000, max: 10000000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items: CartItem[]) => {
          const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
          const discount = 0;
          const total = subtotal - discount;

          const mockOnCheckout = vi.fn();
          const mockOnUpdateQuantity = vi.fn();
          const mockOnRemoveItem = vi.fn();

          const { unmount } = render(
            <Cart
              items={items}
              onUpdateQuantity={mockOnUpdateQuantity}
              onRemoveItem={mockOnRemoveItem}
              onCheckout={mockOnCheckout}
              subtotal={subtotal}
              discount={discount}
              total={total}
            />
          );

          // Property: For any non-empty cart, checkout button should be present
          const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
          expect(checkoutButton).not.toBeNull();

          // Clean up after each iteration
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 17: Empty cart does not show checkout button', () => {
    const mockOnCheckout = vi.fn();
    const mockOnUpdateQuantity = vi.fn();
    const mockOnRemoveItem = vi.fn();

    render(
      <Cart
        items={[]}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onCheckout={mockOnCheckout}
        subtotal={0}
        discount={0}
        total={0}
      />
    );

    // Property: Empty cart should not have checkout button
    const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
    expect(checkoutButton).toBeNull();

    // Should show empty state message
    expect(screen.getByText(/keranjang kosong/i)).toBeDefined();
  });
});
