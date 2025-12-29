import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

const OFFLINE_TRANSACTIONS_KEY = 'offline_transactions';
const OFFLINE_LOCATIONS_KEY = 'offline_locations';
const OFFLINE_CHECKPOINTS_KEY = 'offline_checkpoints';
const OFFLINE_STOCK_MOVEMENTS_KEY = 'offline_stock_movements';
const OFFLINE_ATTENDANCE_KEY = 'offline_attendance';
const OFFLINE_ORDER_UPDATES_KEY = 'offline_order_updates';

interface OfflineTransaction {
  id: string;
  table?: string;
  operation?: 'insert' | 'update' | 'delete';
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

interface OfflineLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  synced: boolean;
  retryCount?: number;
}

interface OfflineCheckpoint {
  id: string;
  table?: string;
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

interface OfflineStockMovement {
  id: string;
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

interface OfflineAttendance {
  id: string;
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

interface OfflineOrderUpdate {
  id: string;
  orderId: string;
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingTransactions: OfflineTransaction[];
  pendingLocations: OfflineLocation[];
  pendingCheckpoints: OfflineCheckpoint[];
  pendingStockMovements: OfflineStockMovement[];
  pendingAttendance: OfflineAttendance[];
  pendingOrderUpdates: OfflineOrderUpdate[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncErrors: string[];

  // Actions
  initNetworkListener: () => () => void;
  checkConnection: () => Promise<boolean>;
  
  // Queue operations
  queueTransaction: (transaction: any) => Promise<void>;
  queueLocation: (riderId: string, location: any) => Promise<void>;
  queueCheckpoint: (checkpoint: any) => Promise<void>;
  queueStockMovement: (stockMovement: any) => Promise<void>;
  queueAttendance: (attendance: any) => Promise<void>;
  queueOrderUpdate: (orderId: string, updateData: any) => Promise<void>;
  
  // Sync operations
  syncAll: () => Promise<void>;
  syncTransactions: () => Promise<void>;
  syncLocations: () => Promise<void>;
  syncCheckpoints: () => Promise<void>;
  syncStockMovements: () => Promise<void>;
  syncAttendance: () => Promise<void>;
  syncOrderUpdates: () => Promise<void>;
  
  // Load from storage
  loadPendingData: () => Promise<void>;
  clearSyncedData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Retry logic
  retryFailedSync: () => Promise<void>;
  clearSyncErrors: () => void;
}

const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 10;

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  isConnected: true,
  connectionType: null,
  pendingTransactions: [],
  pendingLocations: [],
  pendingCheckpoints: [],
  pendingStockMovements: [],
  pendingAttendance: [],
  pendingOrderUpdates: [],
  isSyncing: false,
  lastSyncAt: null,
  syncErrors: [],

  initNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;
      
      set({
        isOnline,
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
      });

      // Auto-sync when coming back online
      if (isOnline) {
        setTimeout(() => {
          get().syncAll();
        }, 2000); // Wait 2 seconds before syncing
      }
    });

    // Initial check
    get().checkConnection();
    get().loadPendingData();

    return unsubscribe;
  },

  checkConnection: async () => {
    const state = await NetInfo.fetch();
    const isOnline = state.isConnected === true && state.isInternetReachable === true;
    
    set({
      isOnline,
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
    });

    return isOnline;
  },

  queueTransaction: async (transaction: any) => {
    const offlineTransaction: OfflineTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      table: transaction.table || 'transactions',
      operation: transaction.operation || 'insert',
      data: transaction,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingTransactions } = get();
    const updated = [...pendingTransactions, offlineTransaction];
    
    set({ pendingTransactions: updated });
    await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updated));
  },

  queueLocation: async (riderId: string, location: any) => {
    const offlineLocation: OfflineLocation = {
      riderId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingLocations } = get();
    // Keep only last 100 locations to prevent storage overflow
    const updated = [...pendingLocations.slice(-99), offlineLocation];
    
    set({ pendingLocations: updated });
    await AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(updated));
  },

  queueCheckpoint: async (checkpoint: any) => {
    const offlineCheckpoint: OfflineCheckpoint = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      table: checkpoint.table || 'rider_checkpoints',
      data: checkpoint,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingCheckpoints } = get();
    const updated = [...pendingCheckpoints, offlineCheckpoint];
    
    set({ pendingCheckpoints: updated });
    await AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(updated));
  },

  queueStockMovement: async (stockMovement: any) => {
    const offlineStockMovement: OfflineStockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: stockMovement,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingStockMovements } = get();
    const updated = [...pendingStockMovements, offlineStockMovement];
    
    set({ pendingStockMovements: updated });
    await AsyncStorage.setItem(OFFLINE_STOCK_MOVEMENTS_KEY, JSON.stringify(updated));
  },

  queueAttendance: async (attendance: any) => {
    const offlineAttendance: OfflineAttendance = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: attendance,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingAttendance } = get();
    const updated = [...pendingAttendance, offlineAttendance];
    
    set({ pendingAttendance: updated });
    await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(updated));
  },

  queueOrderUpdate: async (orderId: string, updateData: any) => {
    const offlineOrderUpdate: OfflineOrderUpdate = {
      id: `ou_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      orderId,
      data: updateData,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    const { pendingOrderUpdates } = get();
    const updated = [...pendingOrderUpdates, offlineOrderUpdate];
    
    set({ pendingOrderUpdates: updated });
    await AsyncStorage.setItem(OFFLINE_ORDER_UPDATES_KEY, JSON.stringify(updated));
  },

  loadPendingData: async () => {
    try {
      const [transactions, locations, checkpoints, stockMovements, attendance, orderUpdates] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY),
        AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY),
        AsyncStorage.getItem(OFFLINE_CHECKPOINTS_KEY),
        AsyncStorage.getItem(OFFLINE_STOCK_MOVEMENTS_KEY),
        AsyncStorage.getItem(OFFLINE_ATTENDANCE_KEY),
        AsyncStorage.getItem(OFFLINE_ORDER_UPDATES_KEY),
      ]);

      set({
        pendingTransactions: transactions ? JSON.parse(transactions) : [],
        pendingLocations: locations ? JSON.parse(locations) : [],
        pendingCheckpoints: checkpoints ? JSON.parse(checkpoints) : [],
        pendingStockMovements: stockMovements ? JSON.parse(stockMovements) : [],
        pendingAttendance: attendance ? JSON.parse(attendance) : [],
        pendingOrderUpdates: orderUpdates ? JSON.parse(orderUpdates) : [],
      });
    } catch (error) {
      console.error('Error loading pending data:', error);
    }
  },

  syncAll: async () => {
    const { isOnline, isSyncing } = get();
    
    if (!isOnline || isSyncing) return;

    set({ isSyncing: true, syncErrors: [] });

    try {
      await Promise.all([
        get().syncTransactions(),
        get().syncLocations(),
        get().syncCheckpoints(),
        get().syncStockMovements(),
        get().syncAttendance(),
        get().syncOrderUpdates(),
      ]);

      set({ lastSyncAt: new Date() });
      await get().clearSyncedData();
    } catch (error) {
      console.error('Error syncing all:', error);
      const { syncErrors } = get();
      set({ syncErrors: [...syncErrors, `Sync error: ${error}`] });
    } finally {
      set({ isSyncing: false });
    }
  },

  syncTransactions: async () => {
    const { pendingTransactions } = get();
    const unsynced = pendingTransactions.filter(t => !t.synced && (t.retryCount || 0) < MAX_RETRY_COUNT);

    // Process in batches
    for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
      const batch = unsynced.slice(i, i + BATCH_SIZE);
      
      for (const txn of batch) {
        try {
          const table = txn.table || 'transactions';
          const operation = txn.operation || 'insert';
          
          let result;
          if (operation === 'insert') {
            result = await supabase.from(table).insert(txn.data);
          } else if (operation === 'update') {
            result = await supabase.from(table).update(txn.data).eq('id', txn.data.id);
          } else if (operation === 'delete') {
            result = await supabase.from(table).delete().eq('id', txn.data.id);
          }
          
          if (!result?.error) {
            txn.synced = true;
            txn.lastError = undefined;
          } else {
            throw result.error;
          }
        } catch (error) {
          console.error('Error syncing transaction:', error);
          txn.retryCount = (txn.retryCount || 0) + 1;
          txn.lastError = error instanceof Error ? error.message : String(error);
        }
      }
    }

    set({ pendingTransactions });
    await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(pendingTransactions));
  },

  syncLocations: async () => {
    const { pendingLocations } = get();
    const unsynced = pendingLocations.filter(l => !l.synced && (l.retryCount || 0) < MAX_RETRY_COUNT);

    // Batch update - only send latest location per rider
    const latestByRider: Record<string, OfflineLocation> = {};
    unsynced.forEach(loc => {
      const existing = latestByRider[loc.riderId];
      if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
        latestByRider[loc.riderId] = loc;
      }
    });

    for (const riderId of Object.keys(latestByRider)) {
      const location = latestByRider[riderId];
      try {
        const { error } = await supabase.from('rider_locations').upsert({
          rider_id: riderId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updated_at: location.timestamp,
        }, { onConflict: 'rider_id' });

        if (!error) {
          // Mark all locations for this rider as synced
          pendingLocations.forEach(l => {
            if (l.riderId === riderId) l.synced = true;
          });
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error syncing location:', error);
        location.retryCount = (location.retryCount || 0) + 1;
      }
    }

    set({ pendingLocations });
    await AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(pendingLocations));
  },

  syncCheckpoints: async () => {
    const { pendingCheckpoints } = get();
    const unsynced = pendingCheckpoints.filter(c => !c.synced && (c.retryCount || 0) < MAX_RETRY_COUNT);

    for (const checkpoint of unsynced) {
      try {
        const table = checkpoint.table || 'rider_checkpoints';
        const { error } = await supabase.from(table).insert(checkpoint.data);
        
        if (!error) {
          checkpoint.synced = true;
          checkpoint.lastError = undefined;
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error syncing checkpoint:', error);
        checkpoint.retryCount = (checkpoint.retryCount || 0) + 1;
        checkpoint.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    set({ pendingCheckpoints });
    await AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(pendingCheckpoints));
  },

  syncStockMovements: async () => {
    const { pendingStockMovements } = get();
    const unsynced = pendingStockMovements.filter(sm => !sm.synced && (sm.retryCount || 0) < MAX_RETRY_COUNT);

    for (const stockMovement of unsynced) {
      try {
        const { error } = await supabase.from('stock_movements').insert(stockMovement.data);
        
        if (!error) {
          stockMovement.synced = true;
          stockMovement.lastError = undefined;
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error syncing stock movement:', error);
        stockMovement.retryCount = (stockMovement.retryCount || 0) + 1;
        stockMovement.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    set({ pendingStockMovements });
    await AsyncStorage.setItem(OFFLINE_STOCK_MOVEMENTS_KEY, JSON.stringify(pendingStockMovements));
  },

  syncAttendance: async () => {
    const { pendingAttendance } = get();
    const unsynced = pendingAttendance.filter(a => !a.synced && (a.retryCount || 0) < MAX_RETRY_COUNT);

    for (const attendance of unsynced) {
      try {
        const { error } = await supabase.from('rider_attendance').insert(attendance.data);
        
        if (!error) {
          attendance.synced = true;
          attendance.lastError = undefined;
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error syncing attendance:', error);
        attendance.retryCount = (attendance.retryCount || 0) + 1;
        attendance.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    set({ pendingAttendance });
    await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(pendingAttendance));
  },

  syncOrderUpdates: async () => {
    const { pendingOrderUpdates } = get();
    const unsynced = pendingOrderUpdates.filter(ou => !ou.synced && (ou.retryCount || 0) < MAX_RETRY_COUNT);

    for (const orderUpdate of unsynced) {
      try {
        const { error } = await supabase
          .from('customer_orders')
          .update(orderUpdate.data)
          .eq('id', orderUpdate.orderId);
        
        if (!error) {
          orderUpdate.synced = true;
          orderUpdate.lastError = undefined;
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error syncing order update:', error);
        orderUpdate.retryCount = (orderUpdate.retryCount || 0) + 1;
        orderUpdate.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    set({ pendingOrderUpdates });
    await AsyncStorage.setItem(OFFLINE_ORDER_UPDATES_KEY, JSON.stringify(pendingOrderUpdates));
  },

  clearSyncedData: async () => {
    const { 
      pendingTransactions, 
      pendingLocations, 
      pendingCheckpoints,
      pendingStockMovements,
      pendingAttendance,
      pendingOrderUpdates
    } = get();

    const filteredTransactions = pendingTransactions.filter(t => !t.synced);
    const filteredLocations = pendingLocations.filter(l => !l.synced);
    const filteredCheckpoints = pendingCheckpoints.filter(c => !c.synced);
    const filteredStockMovements = pendingStockMovements.filter(sm => !sm.synced);
    const filteredAttendance = pendingAttendance.filter(a => !a.synced);
    const filteredOrderUpdates = pendingOrderUpdates.filter(ou => !ou.synced);

    set({
      pendingTransactions: filteredTransactions,
      pendingLocations: filteredLocations,
      pendingCheckpoints: filteredCheckpoints,
      pendingStockMovements: filteredStockMovements,
      pendingAttendance: filteredAttendance,
      pendingOrderUpdates: filteredOrderUpdates,
    });

    await Promise.all([
      AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(filteredTransactions)),
      AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(filteredLocations)),
      AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(filteredCheckpoints)),
      AsyncStorage.setItem(OFFLINE_STOCK_MOVEMENTS_KEY, JSON.stringify(filteredStockMovements)),
      AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(filteredAttendance)),
      AsyncStorage.setItem(OFFLINE_ORDER_UPDATES_KEY, JSON.stringify(filteredOrderUpdates)),
    ]);
  },

  clearAllData: async () => {
    set({
      pendingTransactions: [],
      pendingLocations: [],
      pendingCheckpoints: [],
      pendingStockMovements: [],
      pendingAttendance: [],
      pendingOrderUpdates: [],
      syncErrors: [],
    });

    await Promise.all([
      AsyncStorage.removeItem(OFFLINE_TRANSACTIONS_KEY),
      AsyncStorage.removeItem(OFFLINE_LOCATIONS_KEY),
      AsyncStorage.removeItem(OFFLINE_CHECKPOINTS_KEY),
      AsyncStorage.removeItem(OFFLINE_STOCK_MOVEMENTS_KEY),
      AsyncStorage.removeItem(OFFLINE_ATTENDANCE_KEY),
      AsyncStorage.removeItem(OFFLINE_ORDER_UPDATES_KEY),
    ]);
  },

  retryFailedSync: async () => {
    const { isOnline } = get();
    if (!isOnline) return;

    // Reset retry counts for failed items
    const { 
      pendingTransactions, 
      pendingLocations, 
      pendingCheckpoints,
      pendingStockMovements,
      pendingAttendance,
      pendingOrderUpdates
    } = get();

    pendingTransactions.forEach(t => {
      if (!t.synced && (t.retryCount || 0) >= MAX_RETRY_COUNT) {
        t.retryCount = 0;
      }
    });

    pendingLocations.forEach(l => {
      if (!l.synced && (l.retryCount || 0) >= MAX_RETRY_COUNT) {
        l.retryCount = 0;
      }
    });

    pendingCheckpoints.forEach(c => {
      if (!c.synced && (c.retryCount || 0) >= MAX_RETRY_COUNT) {
        c.retryCount = 0;
      }
    });

    pendingStockMovements.forEach(sm => {
      if (!sm.synced && (sm.retryCount || 0) >= MAX_RETRY_COUNT) {
        sm.retryCount = 0;
      }
    });

    pendingAttendance.forEach(a => {
      if (!a.synced && (a.retryCount || 0) >= MAX_RETRY_COUNT) {
        a.retryCount = 0;
      }
    });

    pendingOrderUpdates.forEach(ou => {
      if (!ou.synced && (ou.retryCount || 0) >= MAX_RETRY_COUNT) {
        ou.retryCount = 0;
      }
    });

    set({ 
      pendingTransactions,
      pendingLocations,
      pendingCheckpoints,
      pendingStockMovements,
      pendingAttendance,
      pendingOrderUpdates
    });

    // Trigger sync
    await get().syncAll();
  },

  clearSyncErrors: () => {
    set({ syncErrors: [] });
  },
}));
