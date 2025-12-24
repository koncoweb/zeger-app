import { create } from 'zustand';
import { Product } from '@/lib/supabase';

export interface CartItem extends Product {
  quantity: number;
  customizations: {
    size?: string;
    ice?: string;
    sugar?: string;
    notes?: string;
  };
}

interface CartState {
  items: CartItem[];
  selectedOutlet: {
    id: string;
    name: string;
    address: string;
  } | null;
  
  // Actions
  addItem: (product: Product, quantity?: number, customizations?: CartItem['customizations']) => void;
  removeItem: (productId: string, customizations: CartItem['customizations']) => void;
  updateQuantity: (productId: string, customizations: CartItem['customizations'], quantity: number) => void;
  clearCart: () => void;
  setSelectedOutlet: (outlet: CartState['selectedOutlet']) => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemPrice: (item: CartItem) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedOutlet: null,

  addItem: (product, quantity = 1, customizations = {}) => {
    const { items } = get();
    const cartKey = `${product.id}-${JSON.stringify(customizations)}`;
    
    const existingIndex = items.findIndex(
      (item) => `${item.id}-${JSON.stringify(item.customizations)}` === cartKey
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      set({ items: newItems });
    } else {
      // Add new item
      set({
        items: [...items, { ...product, quantity, customizations }],
      });
    }
  },

  removeItem: (productId, customizations) => {
    const { items } = get();
    const cartKey = `${productId}-${JSON.stringify(customizations)}`;
    
    set({
      items: items.filter(
        (item) => `${item.id}-${JSON.stringify(item.customizations)}` !== cartKey
      ),
    });
  },

  updateQuantity: (productId, customizations, quantity) => {
    const { items } = get();
    const cartKey = `${productId}-${JSON.stringify(customizations)}`;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      set({
        items: items.filter(
          (item) => `${item.id}-${JSON.stringify(item.customizations)}` !== cartKey
        ),
      });
    } else {
      // Update quantity
      set({
        items: items.map((item) =>
          `${item.id}-${JSON.stringify(item.customizations)}` === cartKey
            ? { ...item, quantity }
            : item
        ),
      });
    }
  },

  clearCart: () => {
    set({ items: [], selectedOutlet: null });
  },

  setSelectedOutlet: (outlet) => {
    set({ selectedOutlet: outlet });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    const { items, getItemPrice } = get();
    return items.reduce((total, item) => total + getItemPrice(item) * item.quantity, 0);
  },

  getItemPrice: (item) => {
    let price = item.price;
    
    // Add size upcharge
    if (item.customizations?.size === 'Large') {
      price += 5000;
    }
    
    return price;
  },
}));
