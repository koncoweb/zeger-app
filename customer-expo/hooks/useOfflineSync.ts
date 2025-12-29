import { useState, useEffect, useCallback } from 'react';
import { useOfflineStore, CustomerOfflineManager } from '../store/offlineStore';
import { supabase } from '../lib/supabase';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number;
  syncProgress: number;
  syncError: string | null;
  pendingCount: number;
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: 0,
    syncProgress: 0,
    syncError: null,
    pendingCount: 0,
  });

  const {
    isOnline,
    syncQueue,
    removeFromSyncQueue,
    incrementRetryCount,
    setLastSyncTime,
    lastSyncTime,
  } = useOfflineStore();

  const offlineManager = CustomerOfflineManager.getInstance();

  // Update pending count when sync queue changes
  useEffect(() => {
    setSyncStatus((prev) => ({
      ...prev,
      pendingCount: syncQueue.length,
      lastSyncTime,
    }));
  }, [syncQueue.length, lastSyncTime]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !syncStatus.isSyncing) {
      syncOfflineData();
    }
  }, [isOnline, syncQueue.length]);

  const syncOfflineData = useCallback(async () => {
    if (syncStatus.isSyncing || !isOnline || syncQueue.length === 0) {
      return;
    }

    setSyncStatus((prev) => ({
      ...prev,
      isSyncing: true,
      syncProgress: 0,
      syncError: null,
    }));

    try {
      const totalItems = syncQueue.length;
      let processedItems = 0;

      for (const item of syncQueue) {
        try {
          await syncSingleItem(item);
          removeFromSyncQueue(item.id);
          processedItems++;
          
          setSyncStatus((prev) => ({
            ...prev,
            syncProgress: (processedItems / totalItems) * 100,
          }));
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
          
          // Increment retry count
          incrementRetryCount(item.id);
          
          // Remove item if retry count exceeds limit
          if (item.retryCount >= 3) {
            removeFromSyncQueue(item.id);
          }
        }
      }

      // Update last sync time
      setLastSyncTime(Date.now());

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncProgress: 100,
        lastSyncTime: Date.now(),
      }));

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [isOnline, syncQueue, syncStatus.isSyncing]);

  const syncSingleItem = async (item: any) => {
    switch (item.type) {
      case 'order':
        return await syncOrder(item.data);
      case 'profile':
        return await syncProfile(item.data);
      case 'address':
        return await syncAddress(item.data);
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  };

  const syncOrder = async (orderData: any) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData);

    if (error) {
      throw new Error(`Failed to sync order: ${error.message}`);
    }

    return data;
  };

  const syncProfile = async (profileData: any) => {
    const { data, error } = await supabase
      .from('customers')
      .upsert(profileData);

    if (error) {
      throw new Error(`Failed to sync profile: ${error.message}`);
    }

    return data;
  };

  const syncAddress = async (addressData: any) => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .upsert(addressData);

    if (error) {
      throw new Error(`Failed to sync address: ${error.message}`);
    }

    return data;
  };

  const forcSync = useCallback(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);

  const clearSyncError = useCallback(() => {
    setSyncStatus((prev) => ({
      ...prev,
      syncError: null,
    }));
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          console.log('Service worker sync completed:', event.data.syncedCount);
          // Refresh sync status
          setSyncStatus((prev) => ({
            ...prev,
            lastSyncTime: Date.now(),
          }));
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return {
    ...syncStatus,
    syncOfflineData,
    forcSync,
    clearSyncError,
    canSync: isOnline && syncQueue.length > 0,
    hasOfflineData: syncQueue.length > 0,
  };
};

export default useOfflineSync;