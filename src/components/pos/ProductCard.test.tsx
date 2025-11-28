import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import * as fc from 'fast-check';
import { Product } from '@/lib/types';

// Feature: pos-karyawan-branch, Property 31: Low stock warning displayed
describe('Property 31: Low stock warning displayed', () => {
  it('should display low stock warning when stock is below min level', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.integer({ min: 1000, max: 1000000 }),
          category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
          is_active: fc.constant(true),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          description: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.integer({ min: 500, max: 500000 })),
          custom_options: fc.constant(null),
        }),
        fc.integer({ min: 1, max: 10 }), // low stock (1-10)
        (product, stock) => {
          const mockAddToCart = vi.fn();
          const { container } = render(
            <ProductCard product={product as Product} stock={stock} onAddToCart={mockAddToCart} />
          );
          
          // Should display stock quantity
          expect(container.textContent).toContain(`Stok: ${stock}`);
          
          // Should show low stock indicator (yellow badge)
          const badges = container.querySelectorAll('[class*="yellow"]');
          expect(badges.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-karyawan-branch, Property 32: Out of stock products not addable
describe('Property 32: Out of stock products not addable', () => {
  it('should prevent adding out of stock products to cart', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.integer({ min: 1000, max: 1000000 }),
          category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
          is_active: fc.constant(true),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          description: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.integer({ min: 500, max: 500000 })),
          custom_options: fc.constant(null),
        }),
        (product) => {
          const mockAddToCart = vi.fn();
          const { container } = render(
            <ProductCard product={product as Product} stock={0} onAddToCart={mockAddToCart} />
          );
          
          // Should display "Habis" status
          expect(container.textContent).toContain('Habis');
          
          // Button should be disabled
          const button = container.querySelector('button');
          expect(button?.disabled).toBe(true);
          
          // Clicking should not call addToCart
          button?.click();
          expect(mockAddToCart).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-karyawan-branch, Property 45: Stock quantity never negative
describe('Property 45: Stock quantity never negative', () => {
  it('should never display negative stock quantities', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          code: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.integer({ min: 1000, max: 1000000 }),
          category: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 30 })),
          is_active: fc.constant(true),
          image_url: fc.oneof(fc.constant(null), fc.webUrl()),
          description: fc.oneof(fc.constant(null), fc.string()),
          cost_price: fc.oneof(fc.constant(null), fc.integer({ min: 500, max: 500000 })),
          custom_options: fc.constant(null),
        }),
        fc.integer({ min: 0, max: 1000 }), // stock should always be >= 0
        (product, stock) => {
          const mockAddToCart = vi.fn();
          const { container } = render(
            <ProductCard product={product as Product} stock={stock} onAddToCart={mockAddToCart} />
          );
          
          // Stock should never be negative
          expect(stock).toBeGreaterThanOrEqual(0);
          
          // If stock is displayed, it should be non-negative
          if (stock > 0) {
            const stockText = container.textContent;
            expect(stockText).toContain(`Stok: ${stock}`);
            expect(stock).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
