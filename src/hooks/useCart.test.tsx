import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useCart } from './useCart';
import { Product } from '@/lib/types';

describe('Cart Operations Properties', () => {
  // Feature: pos-karyawan-branch, Property 12: Adding product to cart sets quantity to 1
  it('Property 12: Adding product to cart sets quantity to 1', () => {
    fc.assert(
      fc.property(
        // Generate a random product
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.float({ min: 1000, max: 1000000 }),
          is_active: fc.constant(true),
          category: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          ck_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          description: fc.oneof(fc.constant(null), fc.string()),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          custom_options: fc.constant(null),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(null),
        }),
        (product: Product) => {
          const { result } = renderHook(() => useCart());

          // Add product to empty cart
          act(() => {
            result.current.addItem(product);
          });

          // Property: The product should be in the cart with quantity = 1
          const cartItem = result.current.items.find((item) => item.product_id === product.id);
          expect(cartItem).toBeDefined();
          expect(cartItem?.quantity).toBe(1);
          expect(cartItem?.unit_price).toBe(product.price);
          expect(cartItem?.total_price).toBe(product.price);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 13: Adding existing product increments quantity
  it('Property 13: Adding existing product increments quantity', () => {
    fc.assert(
      fc.property(
        // Generate a random product
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.float({ min: 1000, max: 1000000 }),
          is_active: fc.constant(true),
          category: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          ck_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          description: fc.oneof(fc.constant(null), fc.string()),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          custom_options: fc.constant(null),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(null),
        }),
        // Generate number of times to add (2-10)
        fc.integer({ min: 2, max: 10 }),
        (product: Product, timesToAdd: number) => {
          const { result } = renderHook(() => useCart());

          // Add product multiple times
          act(() => {
            for (let i = 0; i < timesToAdd; i++) {
              result.current.addItem(product);
            }
          });

          // Property: The product quantity should equal the number of times added
          const cartItem = result.current.items.find((item) => item.product_id === product.id);
          expect(cartItem).toBeDefined();
          expect(cartItem?.quantity).toBe(timesToAdd);
          expect(cartItem?.total_price).toBe(product.price * timesToAdd);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 14: Quantity change updates item total
  it('Property 14: Quantity change updates item total', () => {
    fc.assert(
      fc.property(
        // Generate a random product
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.float({ min: 1000, max: 1000000 }),
          is_active: fc.constant(true),
          category: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          ck_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
          description: fc.oneof(fc.constant(null), fc.string()),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          custom_options: fc.constant(null),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(null),
        }),
        // Generate new quantity (1-100)
        fc.integer({ min: 1, max: 100 }),
        (product: Product, newQuantity: number) => {
          const { result } = renderHook(() => useCart());

          // Add product to cart
          act(() => {
            result.current.addItem(product);
          });

          // Update quantity
          act(() => {
            result.current.updateQuantity(product.id, newQuantity);
          });

          // Property: total_price should equal quantity * unit_price
          const cartItem = result.current.items.find((item) => item.product_id === product.id);
          expect(cartItem).toBeDefined();
          expect(cartItem?.quantity).toBe(newQuantity);
          expect(cartItem?.total_price).toBe(newQuantity * product.price);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 15: Removing item updates cart
  it('Property 15: Removing item updates cart', () => {
    fc.assert(
      fc.property(
        // Generate array of products
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            code: fc.string({ minLength: 1, maxLength: 20 }),
            price: fc.float({ min: 1000, max: 1000000 }),
            is_active: fc.constant(true),
            category: fc.oneof(fc.constant(null), fc.string()),
            cost_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
            ck_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000 })),
            description: fc.oneof(fc.constant(null), fc.string()),
            image_url: fc.oneof(fc.constant(null), fc.webUrl()),
            custom_options: fc.constant(null),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(null),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (products: Product[]) => {
          const { result } = renderHook(() => useCart());

          // Add all products to cart
          act(() => {
            products.forEach((product) => {
              result.current.addItem(product);
            });
          });

          const initialItemCount = result.current.items.length;
          const productToRemove = products[0];

          // Remove first product
          act(() => {
            result.current.removeItem(productToRemove.id);
          });

          // Property: Item should no longer exist in cart
          const removedItem = result.current.items.find(
            (item) => item.product_id === productToRemove.id
          );
          expect(removedItem).toBeUndefined();

          // Property: Cart should have one less item
          expect(result.current.items.length).toBe(initialItemCount - 1);

          // Property: Cart total should be recalculated (sum of remaining items)
          const expectedTotal = result.current.items.reduce(
            (sum, item) => sum + item.total_price,
            0
          );
          expect(result.current.subtotal).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 16: Cart displays correct totals
  it('Property 16: Cart displays correct totals', () => {
    fc.assert(
      fc.property(
        // Generate array of products with quantities
        fc.array(
          fc.record({
            product: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              code: fc.string({ minLength: 1, maxLength: 20 }),
              price: fc.float({ min: 1000, max: 1000000, noNaN: true }),
              is_active: fc.constant(true),
              category: fc.oneof(fc.constant(null), fc.string()),
              cost_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000, noNaN: true })),
              ck_price: fc.oneof(fc.constant(null), fc.float({ min: 500, max: 500000, noNaN: true })),
              description: fc.oneof(fc.constant(null), fc.string()),
              image_url: fc.oneof(fc.constant(null), fc.webUrl()),
              custom_options: fc.constant(null),
              created_at: fc.constant(new Date().toISOString()),
              updated_at: fc.constant(null),
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (productQuantities: Array<{ product: Product; quantity: number }>) => {
          const { result } = renderHook(() => useCart());

          // Add products with specific quantities
          act(() => {
            productQuantities.forEach(({ product, quantity }) => {
              result.current.addItem(product);
              if (quantity > 1) {
                result.current.updateQuantity(product.id, quantity);
              }
            });
          });

          // Calculate expected subtotal
          const expectedSubtotal = productQuantities.reduce(
            (sum, { product, quantity }) => sum + product.price * quantity,
            0
          );

          // Property: Subtotal should equal sum of all item totals
          expect(result.current.subtotal).toBeCloseTo(expectedSubtotal, 2);

          // Property: Total should equal subtotal - discount
          const expectedTotal = Math.max(0, expectedSubtotal - result.current.discount);
          expect(result.current.total).toBeCloseTo(expectedTotal, 2);

          // Property: Item count should equal sum of all quantities
          const expectedItemCount = productQuantities.reduce(
            (sum, { quantity }) => sum + quantity,
            0
          );
          expect(result.current.itemCount).toBe(expectedItemCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
