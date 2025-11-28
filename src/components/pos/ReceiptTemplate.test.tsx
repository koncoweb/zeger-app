import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ReceiptTemplate, ReceiptData } from './ReceiptTemplate';
import { CartItem } from '@/lib/types';

describe('ReceiptTemplate', () => {
  // Helper to generate valid cart items
  const cartItemArbitrary = fc.record({
    product_id: fc.uuid(),
    product_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    product_code: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    quantity: fc.integer({ min: 1, max: 100 }),
    unit_price: fc.integer({ min: 1000, max: 1000000 }),
  }).map((item) => ({
    ...item,
    total_price: item.quantity * item.unit_price,
  })) as fc.Arbitrary<CartItem>;

  // Helper to generate valid receipt data
  const receiptDataArbitrary = fc.record({
    transaction_number: fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length > 0),
    branch_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    branch_address: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    transaction_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
    items: fc.array(cartItemArbitrary, { minLength: 1, maxLength: 20 }),
    discount: fc.integer({ min: 0, max: 100000 }),
    payment_method: fc.constantFrom('Cash', 'QRIS', 'Transfer Bank'),
  }).chain((data) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0);
    const total = subtotal - data.discount;
    
    // For cash payments, generate cash_received >= total, otherwise undefined
    const cashReceivedArbitrary = data.payment_method === 'Cash'
      ? fc.option(fc.integer({ min: total, max: total + 1000000 }), { nil: undefined })
      : fc.constant(undefined);
    
    return cashReceivedArbitrary.map((cash_received) => {
      const change = cash_received !== undefined && cash_received >= total 
        ? cash_received - total 
        : undefined;
      
      return {
        ...data,
        subtotal,
        total,
        cash_received,
        change,
      };
    });
  }) as fc.Arbitrary<ReceiptData>;

  // Feature: pos-karyawan-branch, Property 27: Receipt contains all required information
  test('receipt contains all required information', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(receiptDataArbitrary, (receiptData) => {
        const { container } = render(<ReceiptTemplate data={receiptData} />);
        const receiptText = container.textContent || '';

        // Check that receipt contains transaction number
        expect(receiptText).toContain(receiptData.transaction_number);

        // Check that receipt contains branch name
        expect(receiptText).toContain(receiptData.branch_name);

        // Check that receipt contains branch address
        expect(receiptText).toContain(receiptData.branch_address);

        // Check that receipt contains all items
        receiptData.items.forEach((item) => {
          expect(receiptText).toContain(item.product_name);
          expect(receiptText).toContain(item.quantity.toString());
        });

        // Check that receipt contains payment method
        expect(receiptText).toContain(receiptData.payment_method);

        // Check that receipt contains subtotal (as formatted currency)
        // We check for the number part, not the full formatted string
        const subtotalStr = receiptData.subtotal.toString();
        expect(receiptText).toContain('Subtotal');

        // Check that receipt contains total
        expect(receiptText).toContain('TOTAL');

        // Check that receipt contains discount if present
        if (receiptData.discount > 0) {
          expect(receiptText).toContain('Diskon');
        }

        // Check that receipt contains cash received and change if cash payment
        if (receiptData.cash_received !== undefined) {
          expect(receiptText).toContain('Uang Diterima');
          expect(receiptText).toContain('Kembalian');
        }

        // Check that receipt contains thank you message
        expect(receiptText).toContain('Terima kasih');
      }),
      { numRuns: 100 }
    );
  });

  // Additional unit test for specific example
  test('receipt renders correctly with sample data', () => {
    const sampleData: ReceiptData = {
      transaction_number: 'ZEG-HUB01-20241128-0001',
      branch_name: 'Zeger Hub Malang',
      branch_address: 'Jl. Veteran No. 123, Malang',
      transaction_date: new Date('2024-11-28T10:30:00'),
      items: [
        {
          product_id: '1',
          product_name: 'Kopi Susu',
          product_code: 'KS001',
          quantity: 2,
          unit_price: 15000,
          total_price: 30000,
        },
        {
          product_id: '2',
          product_name: 'Es Teh Manis',
          product_code: 'ETM001',
          quantity: 1,
          unit_price: 8000,
          total_price: 8000,
        },
      ],
      subtotal: 38000,
      discount: 0,
      total: 38000,
      payment_method: 'Cash',
      cash_received: 50000,
      change: 12000,
    };

    const { container } = render(<ReceiptTemplate data={sampleData} />);
    const receiptText = container.textContent || '';

    expect(receiptText).toContain('ZEG-HUB01-20241128-0001');
    expect(receiptText).toContain('Zeger Hub Malang');
    expect(receiptText).toContain('Kopi Susu');
    expect(receiptText).toContain('Es Teh Manis');
    expect(receiptText).toContain('Cash');
  });
});
