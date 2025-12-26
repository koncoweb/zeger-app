import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

const OFFLINE_TRANSACTIONS_KEY = 'offline_transactions';
const OFFLINE_LOCATIONS_KEY = 'offline_locations';
const OFFLINE_CHECKPOINTS_KEY = 'offline_checkpoints';

interface OfflineTransaction {
  id: string;
  data: any;
  createdAt: string;
  synced: boolean;
}

interface OfflineLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  synced: boolean;
}

interface OfflineCheckpoint {
  id: string;
  data: any;
  createdAt: string;
  synced: boolean;
}

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingTransactions: OfflineTransaction[];
  pendingLocations: OfflineLocation[];
  pendingCheckpoints: OfflineCheckpoint[];
  isSyncing: boolean;
  lastSyncAt: Date | null;

  // Actions
  initNetworkListener: () => () => void;
  checkConnection: () => Promise<boolean>;
  
  // Queue operations
  queueTransaction: (transaction: any) => Promise<void>;
  queueLocation: (riderId: string, location: any) => Promise<void>;
  queueCheckpoint: (checkpoint: any) => Promise<void>;
  
  // Sync operations
  syncAll: () => Promise<void>;
  syncTransactions: () => Promise<void>;
  syncLocations: () => Promise<void>;
  syncCheckpoints: () => Promise<void>;
  
  // Load from storage
  loadPendingData: () => Promise<void>;
  clearSyncedData: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  isConnected: true,
  connectionType: null,
  pendingTransactions: [],
  pendingLocations: [],
  pendingCheckpoints: [],
  isSyncing: false,
  lastSyncAt: null,

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
        get().syncAll();
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
      data: transaction,
      createdAt: new Date().toISOString(),
      synced: false,
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
      data: checkpoint,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    const { pendingCheckpoints } = get();
    const updated = [...pendingCheckpoints, offlineCheckpoint];
    
    set({ pendingCheckpoints: updated });
    await AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(updated));
  },

  loadPendingData: async () => {
    try {
      const [transactions, locations, checkpoints] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY),
        AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY),
        AsyncStorage.getItem(OFFLINE_CHECKPOINTS_KEY),
      ]);

      set({
        pendingTransactions: transactions ? JSON.parse(transactions) : [],
        pendingLocations: locations ? JSON.parse(locations) : [],
        pendingCheckpoints: checkpoints ? JSON.parse(checkpoints) : [],
      });
    } catch (error) {
      console.error('Error loading pending data:', error);
    }
  },

  syncAll: async () => {
    const { isOnline, isSyncing } = get();
    
    if (!isOnline || isSyncing) return;

    set({ isSyncing: true });

    try {
      await Promise.all([
        get().syncTransactions(),
        get().syncLocations(),
        get().syncCheckpoints(),
      ]);

      set({ lastSyncAt: new Date() });
      await get().clearSyncedData();
    } catch (error) {
      console.error('Error syncing all:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  syncTransactions: async () => {
    const { pendingTransactions } = get();
    const unsynced = pendingTransactions.filter(t => !t.synced);

    for (const txn of unsynced) {
      try {
        // Create transaction
        const { error } = await supabase.from('transactions').insert(txn.data);
        
        if (!error) {
          txn.synced = true;
        }
      } catch (error) {
        console.error('Error syncing transaction:', error);
      }
    }

    set({ pendingTransactions });
    await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(pendingTransactions));
  },

  syncLocations: async () => {
    const { pendingLocations } = get();
    const unsynced = pendingLocations.filter(l => !l.synced);

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
        }
      } catch (error) {
        console.error('Error syncing location:', error);
      }
    }

    set({ pendingLocations });
    await AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(pendingLocations));
  },

  syncCheckpoints: async () => {
    const { pendingCheckpoints } = get();
    const unsynced = pendingCheckpoints.filter(c => !c.synced);

    for (const checkpoint of unsynced) {
      try {
        const { error } = await supabase.from('rider_checkpoints').insert(checkpoint.data);
        
        if (!error) {
          checkpoint.synced = true;
        }
      } catch (error) {
        console.error('Error syncing checkpoint:', error);
      }
    }

    set({ pendingCheckpoints });
    await AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(pendingCheckpoints));
  },

  clearSyncedData: async () => {
    const { pendingTransactions, pendingLocations, pendingCheckpoints } = get();

    const filteredTransactions = pendingTransactions.filter(t => !t.synced);
    const filteredLocations = pendingLocations.filter(l => !l.synced);
    const filteredCheckpoints = pendingCheckpoints.filter(c => !c.synced);

    set({
      pendingTransactions: filteredTransactions,
      pendingLocations: filteredLocations,
      pendingCheckpoints: filteredCheckpoints,
    });

    await Promise.all([
      AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(filteredTransactions)),
      AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(filteredLocations)),
      AsyncStorage.setItem(OFFLINE_CHECKPOINTS_KEY, JSON.stringify(filteredCheckpoints)),
    ]);
  },
}));
