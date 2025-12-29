import { useEffect } from 'react';
import { useOfflineStore } from '@/store/offlineStore';

export const useOffline = () => {
  const {
    isOnline,
    isConnected,
    connectionType,
    pendingTransactions,
    pendingLocations,
    pendingCheckpoints,
    pendingStockMovements,
    pendingAttendance,
    pendingOrderUpdates,
    isSyncing,
    lastSyncAt,
    syncErrors,
    initNetworkListener,
    checkConnection,
    queueTransaction,
    queueLocation,
    queueCheckpoint,
    queueStockMovement,
    queueAttendance,
    queueOrderUpdate,
    syncAll,
    syncTransactions,
    syncLocations,
    syncCheckpoints,
    syncStockMovements,
    syncAttendance,
    syncOrderUpdates,
    loadPendingData,
    clearSyncedData,
    clearAllData,
    retryFailedSync,
    clearSyncErrors,
  } = useOfflineStore();

  // Calculate pending counts
  const pendingTransactionCount = pendingTransactions.filter(t => !t.synced).length;
  const pendingLocationCount = pendingLocations.filter(l => !l.synced).length;
  const pendingCheckpointCount = pendingCheckpoints.filter(c => !c.synced).length;
  const pendingStockMovementCount = pendingStockMovements.filter(sm => !sm.synced).length;
  const pendingAttendanceCount = pendingAttendance.filter(a => !a.synced).length;
  const pendingOrderUpdateCount = pendingOrderUpdates.filter(ou => !ou.synced).length;
  
  const pendingCount = 
    pendingTransactionCount + 
    pendingLocationCount + 
    pendingCheckpointCount +
    pendingStockMovementCount +
    pendingAttendanceCount +
    pendingOrderUpdateCount;
    
  const hasPendingData = pendingCount > 0;

  // Calculate failed items (reached max retry count)
  const failedTransactionCount = pendingTransactions.filter(t => !t.synced && (t.retryCount || 0) >= 3).length;
  const failedLocationCount = pendingLocations.filter(l => !l.synced && (l.retryCount || 0) >= 3).length;
  const failedCheckpointCount = pendingCheckpoints.filter(c => !c.synced && (c.retryCount || 0) >= 3).length;
  const failedStockMovementCount = pendingStockMovements.filter(sm => !sm.synced && (sm.retryCount || 0) >= 3).length;
  const failedAttendanceCount = pendingAttendance.filter(a => !a.synced && (a.retryCount || 0) >= 3).length;
  const failedOrderUpdateCount = pendingOrderUpdates.filter(ou => !ou.synced && (ou.retryCount || 0) >= 3).length;
  
  const failedCount = 
    failedTransactionCount + 
    failedLocationCount + 
    failedCheckpointCount +
    failedStockMovementCount +
    failedAttendanceCount +
    failedOrderUpdateCount;
    
  const hasFailedData = failedCount > 0;

  // Initialize network listener on mount
  useEffect(() => {
    const unsubscribe = initNetworkListener();
    return unsubscribe;
  }, [initNetworkListener]);

  return {
    // Connection status
    isOnline,
    isConnected,
    connectionType,
    
    // Pending data
    pendingTransactions,
    pendingLocations,
    pendingCheckpoints,
    pendingStockMovements,
    pendingAttendance,
    pendingOrderUpdates,
    
    // Pending counts
    pendingTransactionCount,
    pendingLocationCount,
    pendingCheckpointCount,
    pendingStockMovementCount,
    pendingAttendanceCount,
    pendingOrderUpdateCount,
    pendingCount,
    hasPendingData,
    
    // Failed data
    failedTransactionCount,
    failedLocationCount,
    failedCheckpointCount,
    failedStockMovementCount,
    failedAttendanceCount,
    failedOrderUpdateCount,
    failedCount,
    hasFailedData,
    
    // Sync status
    isSyncing,
    lastSyncAt,
    syncErrors,
    
    // Actions
    checkConnection,
    queueTransaction,
    queueLocation,
    queueCheckpoint,
    queueStockMovement,
    queueAttendance,
    queueOrderUpdate,
    syncAll,
    syncTransactions,
    syncLocations,
    syncCheckpoints,
    syncStockMovements,
    syncAttendance,
    syncOrderUpdates,
    loadPendingData,
    clearSyncedData,
    clearAllData,
    retryFailedSync,
    clearSyncErrors,
  };
};