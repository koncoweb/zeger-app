import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/lib/supabase';
import { useOfflineStore, CustomerOfflineManager } from './offlineStore';

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
  deliveryAddress: {
    id?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  } | null;
  paymentMethod: {
    type: 'cash' | 'qris' | 'transfer';
    details?: any;
  } | null;
  promoCode: string | null;
  
  // Offline state
  isOfflineMode: boolean;
  lastSyncTime: number;
  
  // Actions
  addItem: (product: Product, quantity?: number, customizations?: CartItem['customizations']) => void;
  addMultipleItems: (items: Array<{ product: Product; quantity: number; customizations: CartItem['customizations'] }>) => void;
  removeItem: (productId: string, customizations: CartItem['customizations']) => void;
  updateQuantity: (productId: string, customizations: CartItem['customizations'], quantity: number) => void;
  clearCart: () => void;
  setSelectedOutlet: (outlet: CartState['selectedOutlet']) => void;
  setDeliveryAddress: (address: CartState['deliveryAddress']) => void;
  setPaymentMethod: (method: CartState['paymentMethod']) => void;
  setPromoCode: (code: string | null) => void;
  
  // Offline actions
  persistCartOffline: () => Promise<void>;
  recoverCartFromOffline: () => Promise<void>;
  queueOrderForSync: (orderData: any) => Promise<void>;
  syncCartWhenOnline: () => Promise<void>;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemPrice: (item: CartItem) => number;
  getDeliveryFee: () => number;
  getFinalTotal: () => number;
  canCheckout: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedOutlet: null,
      deliveryAddress: null,
      paymentMethod: null,
      promoCode: null,
      isOfflineMode: false,
      lastSyncTime: 0,

      addItem: (product, quantity = 1, customizations = {}) => {
        const { items, persistCartOffline } = get();
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
        
        // Persist to offline storage
        persistCartOffline();
      },

      addMultipleItems: (itemsToAdd) => {
        const { addItem } = get();
        itemsToAdd.forEach(({ product, quantity, customizations }) => {
          addItem(product, quantity, customizations);
        });
      },

      removeItem: (productId, customizations) => {
        const { items, persistCartOffline } = get();
        const cartKey = `${productId}-${JSON.stringify(customizations)}`;
        
        set({
          items: items.filter(
            (item) => `${item.id}-${JSON.stringify(item.customizations)}` !== cartKey
          ),
        });
        
        persistCartOffline();
      },

      updateQuantity: (productId, customizations, quantity) => {
        const { items, persistCartOffline } = get();
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
        
        persistCartOffline();
      },

      clearCart: () => {
        set({ 
          items: [], 
          selectedOutlet: null,
          deliveryAddress: null,
          paymentMethod: null,
          promoCode: null,
        });
        
        const { persistCartOffline } = get();
        persistCartOffline();
      },

      setSelectedOutlet: (outlet) => {
        set({ selectedOutlet: outlet });
        const { persistCartOffline } = get();
        persistCartOffline();
      },

      setDeliveryAddress: (address) => {
        set({ deliveryAddress: address });
        const { persistCartOffline } = get();
        persistCartOffline();
      },

      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
        const { persistCartOffline } = get();
        persistCartOffline();
      },

      setPromoCode: (code) => {
        set({ promoCode: code });
        const { persistCartOffline } = get();
        persistCartOffline();
      },

      // Offline methods
      persistCartOffline: async () => {
        const state = get();
        const offlineManager = CustomerOfflineManager.getInstance();
        
        const cartData = {
          items: state.items,
          selectedOutlet: state.selectedOutlet,
          deliveryAddress: state.deliveryAddress,
          paymentMethod: state.paymentMethod,
          promoCode: state.promoCode,
        };
        
        await offlineManager.persistCart(cartData);
      },

      recoverCartFromOffline: async () => {
        const offlineManager = CustomerOfflineManager.getInstance();
        const cartData = await offlineManager.recoverCart();
        
        if (cartData) {
          set({
            items: cartData.items || [],
            selectedOutlet: cartData.selectedOutlet || null,
            deliveryAddress: cartData.deliveryAddress || null,
            paymentMethod: cartData.paymentMethod || null,
            promoCode: cartData.promoCode || null,
          });
        }
      },

      queueOrderForSync: async (orderData) => {
        const offlineManager = CustomerOfflineManager.getInstance();
        await offlineManager.queueOrder(orderData);
        
        // Clear cart after queuing order
        const { clearCart } = get();
        clearCart();
      },

      syncCartWhenOnline: async () => {
        const offlineStore = useOfflineStore.getState();
        
        if (offlineStore.isOnline) {
          // Sync any pending orders
          const offlineManager = CustomerOfflineManager.getInstance();
          const pendingCount = offlineManager.getSyncQueueCount();
          
          if (pendingCount > 0) {
            // Trigger sync through service worker
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
              });
            }
          }
          
          set({ lastSyncTime: Date.now() });
        }
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

      getDeliveryFee: () => {
        const { selectedOutlet, deliveryAddress } = get();
        
        // Calculate delivery fee based on distance
        // For now, return a flat fee
        if (deliveryAddress && selectedOutlet) {
          return 5000; // Rp 5,000 delivery fee
        }
        
        return 0;
      },

      getFinalTotal: () => {
        const { getTotalPrice, getDeliveryFee } = get();
        return getTotalPrice() + getDeliveryFee();
      },

      canCheckout: () => {
        const { items, selectedOutlet, deliveryAddress, paymentMethod } = get();
        
        return (
          items.length > 0 &&
          selectedOutlet !== null &&
          deliveryAddress !== null &&
          paymentMethod !== null
        );
      },
    }),
    {
      name: 'zeger-customer-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        selectedOutlet: state.selectedOutlet,
        deliveryAddress: state.deliveryAddress,
        paymentMethod: state.paymentMethod,
        promoCode: state.promoCode,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
