import { useEffect } from 'react';
import { useOfflineStore } from '@/store/offlineStore';

export function useOffline() {
  const {
    isOnline,
    isConnected,
    connectionType,
    pendingTransactions,
    pendingLocations,
    pendingCheckpoints,
    isSyncing,
    lastSyncAt,
    initNetworkListener,
    checkConnection,
    syncAll,
  } = useOfflineStore();

  const pendingCount = 
    pendingTransactions.filter(t => !t.synced).length +
    pendingLocations.filter(l => !l.synced).length +
    pendingCheckpoints.filter(c => !c.synced).length;

  const hasPendingData = pendingCount > 0;

  return {
    isOnline,
    isConnected,
    connectionType,
    isSyncing,
    lastSyncAt,
    pendingCount,
    hasPendingData,
    initNetworkListener,
    checkConnection,
    syncAll,
  };
}
