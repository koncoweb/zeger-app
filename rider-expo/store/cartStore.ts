import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { CartItem, Customer, Product, Location } from '@/lib/types';
import { generateTransactionNumber } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'amount' | 'percentage';
  paymentMethod: 'cash' | 'qris' | 'transfer';
  notes: string;

  // Computed
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getTotalItems: () => number;

  // Actions
  addItem: (product: Product, maxStock: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock: number) => boolean;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (amount: number, type: 'amount' | 'percentage') => void;
  setPaymentMethod: (method: 'cash' | 'qris' | 'transfer') => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  checkout: (
    riderId: string,
    branchId: string,
    branchCode: string,
    location: Location | null
  ) => Promise<{ error: string | null; transactionId: string | null }>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountType: 'amount',
  paymentMethod: 'cash',
  notes: '',

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();

    if (discountType === 'percentage') {
      return Math.round((subtotal * discount) / 100);
    }
    return discount;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return Math.max(0, subtotal - discountAmount);
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  addItem: (product: Product, maxStock: number) => {
    const { items } = get();
    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= maxStock) {
        return false; // Stock insufficient
      }
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      if (maxStock < 1) {
        return false; // Stock insufficient
      }
      set({ items: [...items, { product, quantity: 1 }] });
    }
    return true;
  },

  removeItem: (productId: string) => {
    const { items } = get();
    set({ items: items.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId: string, quantity: number, maxStock: number) => {
    if (quantity > maxStock) {
      return false; // Stock insufficient
    }

    const { items } = get();
    if (quantity <= 0) {
      set({ items: items.filter((item) => item.product.id !== productId) });
    } else {
      set({
        items: items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      });
    }
    return true;
  },

  setCustomer: (customer: Customer | null) => set({ customer }),

  setDiscount: (amount: number, type: 'amount' | 'percentage') =>
    set({ discount: amount, discountType: type }),

  setPaymentMethod: (method: 'cash' | 'qris' | 'transfer') =>
    set({ paymentMethod: method }),

  setNotes: (notes: string) => set({ notes }),

  clear: () =>
    set({
      items: [],
      customer: null,
      discount: 0,
      discountType: 'amount',
      paymentMethod: 'cash',
      notes: '',
    }),

  checkout: async (riderId, branchId, branchCode, location) => {
    const { items, customer, paymentMethod, notes } = get();
    const total = get().getTotal();
    const discountAmount = get().getDiscountAmount();

    if (items.length === 0) {
      return { error: 'Keranjang kosong', transactionId: null };
    }

    try {
      const transactionNumber = generateTransactionNumber(branchCode);

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          customer_id: customer?.id || null,
          rider_id: riderId,
          branch_id: branchId,
          total_amount: get().getSubtotal(),
          discount_amount: discountAmount,
          final_amount: total,
          payment_method: paymentMethod,
          status: 'completed',
          transaction_date: new Date().toISOString(),
          transaction_latitude: location?.latitude || null,
          transaction_longitude: location?.longitude || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (txError) {
        console.error('Error creating transaction:', txError);
        return { error: 'Gagal membuat transaksi', transactionId: null };
      }

      // Create transaction items
      const transactionItems = items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        console.error('Error creating transaction items:', itemsError);
        // Rollback transaction
        await supabase.from('transactions').delete().eq('id', transaction.id);
        return { error: 'Gagal menyimpan item transaksi', transactionId: null };
      }

      // Deduct inventory
      for (const item of items) {
        const { error: invError } = await supabase.rpc('deduct_rider_inventory', {
          p_rider_id: riderId,
          p_product_id: item.product.id,
          p_quantity: item.quantity,
        });

        if (invError) {
          console.error('Error deducting inventory:', invError);
          // Continue anyway, inventory will be reconciled later
        }
      }

      // Clear cart
      get().clear();

      return { error: null, transactionId: transaction.id };
    } catch (error) {
      console.error('Error in checkout:', error);
      return { error: 'Terjadi kesalahan', transactionId: null };
    }
  },
}));
