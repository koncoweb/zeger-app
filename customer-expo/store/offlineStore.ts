import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for offline data
interface MenuData {
  categories: any[];
  products: any[];
  lastUpdated: number;
}

interface UserData {
  profile: any;
  addresses: any[];
  orderHistory: any[];
  favorites: any[];
}

interface CartData {
  items: any[];
  deliveryAddress?: any;
  paymentMethod?: any;
  promoCode?: string;
}

interface SyncQueueItem {
  id: string;
  type: 'order' | 'profile' | 'address';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineStoreState {
  // Network status
  isOnline: boolean;
  lastSyncTime: number;
  
  // Cached data
  menuData: MenuData | null;
  userData: UserData | null;
  cartData: CartData;
  
  // Sync queue
  syncQueue: SyncQueueItem[];
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  updateMenuData: (data: MenuData) => void;
  updateUserData: (data: UserData) => void;
  updateCartData: (data: CartData) => void;
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromSyncQueue: (id: string) => void;
  incrementRetryCount: (id: string) => void;
  clearSyncQueue: () => void;
  setLastSyncTime: (time: number) => void;
  
  // Utility methods
  isMenuDataStale: () => boolean;
  getOfflineMenu: () => MenuData | null;
  persistCart: (cart: CartData) => void;
  recoverCart: () => CartData;
}

const MENU_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useOfflineStore = create<OfflineStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: true,
      lastSyncTime: 0,
      menuData: null,
      userData: null,
      cartData: {
        items: [],
        deliveryAddress: undefined,
        paymentMethod: undefined,
        promoCode: undefined,
      },
      syncQueue: [],

      // Actions
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        
        // Trigger sync when coming back online
        if (isOnline && get().syncQueue.length > 0) {
          // Notify service worker to start sync
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
            });
          }
        }
      },

      updateMenuData: (data: MenuData) => {
        set({
          menuData: {
            ...data,
            lastUpdated: Date.now(),
          },
        });
      },

      updateUserData: (data: UserData) => {
        set({ userData: data });
      },

      updateCartData: (data: CartData) => {
        set({ cartData: data });
      },

      addToSyncQueue: (item) => {
        const newItem: SyncQueueItem = {
          ...item,
          id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          timestamp: Date.now(),
          retryCount: 0,
        };
        
        set((state) => ({
          syncQueue: [...state.syncQueue, newItem],
        }));
      },

      removeFromSyncQueue: (id: string) => {
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.id !== id),
        }));
      },

      incrementRetryCount: (id: string) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
          ),
        }));
      },

      clearSyncQueue: () => {
        set({ syncQueue: [] });
      },

      setLastSyncTime: (time: number) => {
        set({ lastSyncTime: time });
      },

      // Utility methods
      isMenuDataStale: () => {
        const { menuData } = get();
        if (!menuData) return true;
        
        const now = Date.now();
        const age = now - menuData.lastUpdated;
        return age > MENU_CACHE_DURATION;
      },

      getOfflineMenu: () => {
        const { menuData, isMenuDataStale } = get();
        
        if (!menuData || isMenuDataStale()) {
          return null;
        }
        
        return menuData;
      },

      persistCart: (cart: CartData) => {
        set({ cartData: cart });
      },

      recoverCart: () => {
        return get().cartData;
      },
    }),
    {
      name: 'zeger-customer-offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        menuData: state.menuData,
        userData: state.userData,
        cartData: state.cartData,
        syncQueue: state.syncQueue,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Offline manager class for additional functionality
export class CustomerOfflineManager {
  private static instance: CustomerOfflineManager;
  
  static getInstance(): CustomerOfflineManager {
    if (!CustomerOfflineManager.instance) {
      CustomerOfflineManager.instance = new CustomerOfflineManager();
    }
    return CustomerOfflineManager.instance;
  }

  async cacheMenu(menuData: any): Promise<void> {
    const store = useOfflineStore.getState();
    store.updateMenuData({
      categories: menuData.categories || [],
      products: menuData.products || [],
      lastUpdated: Date.now(),
    });
  }

  async getOfflineMenu(): Promise<any | null> {
    const store = useOfflineStore.getState();
    return store.getOfflineMenu();
  }

  async persistCart(cartData: any): Promise<void> {
    const store = useOfflineStore.getState();
    store.persistCart(cartData);
  }

  async recoverCart(): Promise<any> {
    const store = useOfflineStore.getState();
    return store.recoverCart();
  }

  async queueOrder(orderData: any): Promise<void> {
    const store = useOfflineStore.getState();
    store.addToSyncQueue({
      type: 'order',
      data: orderData,
    });
  }

  async queueProfileUpdate(profileData: any): Promise<void> {
    const store = useOfflineStore.getState();
    store.addToSyncQueue({
      type: 'profile',
      data: profileData,
    });
  }

  async queueAddressUpdate(addressData: any): Promise<void> {
    const store = useOfflineStore.getState();
    store.addToSyncQueue({
      type: 'address',
      data: addressData,
    });
  }

  getSyncQueueCount(): number {
    const store = useOfflineStore.getState();
    return store.syncQueue.length;
  }

  getLastSyncTime(): number {
    const store = useOfflineStore.getState();
    return store.lastSyncTime;
  }

  isOnline(): boolean {
    const store = useOfflineStore.getState();
    return store.isOnline;
  }

  // Clean up old data
  async cleanup(): Promise<void> {
    const store = useOfflineStore.getState();
    
    // Remove failed sync items older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const cleanQueue = store.syncQueue.filter(
      (item) => item.timestamp > sevenDaysAgo && item.retryCount < 5
    );
    
    if (cleanQueue.length !== store.syncQueue.length) {
      store.clearSyncQueue();
      cleanQueue.forEach((item) => {
        store.addToSyncQueue({
          type: item.type,
          data: item.data,
        });
      });
    }
  }
}

export default useOfflineStore;