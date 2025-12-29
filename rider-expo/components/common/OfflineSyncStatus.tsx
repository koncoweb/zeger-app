import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '@/hooks/useOffline';
import { COLORS } from '@/lib/constants';

export const OfflineSyncStatus = () => {
  const {
    isOnline,
    isConnected,
    connectionType,
    pendingCount,
    hasPendingData,
    failedCount,
    hasFailedData,
    isSyncing,
    lastSyncAt,
    syncErrors,
    syncAll,
    retryFailedSync,
    clearSyncErrors,
  } = useOffline();

  const getConnectionIcon = () => {
    if (!isConnected) return 'cloud-offline-outline';
    if (!isOnline) return 'cloud-offline';
    if (connectionType === 'wifi') return 'wifi';
    if (connectionType === 'cellular') return 'cellular';
    return 'cloud-done';
  };

  const getConnectionColor = () => {
    if (!isConnected || !isOnline) return COLORS.error;
    return COLORS.success;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Tidak terhubung';
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Sinkronisasi...';
    if (hasFailedData) return `${failedCount} gagal sinkron`;
    if (hasPendingData) return `${pendingCount} menunggu sinkron`;
    return 'Tersinkron';
  };

  const getStatusColor = () => {
    if (!isConnected || !isOnline) return COLORS.error;
    if (hasFailedData) return COLORS.warning;
    if (hasPendingData) return COLORS.info;
    return COLORS.success;
  };

  const handleSyncPress = () => {
    if (hasFailedData) {
      retryFailedSync();
    } else {
      syncAll();
    }
    
    if (syncErrors.length > 0) {
      clearSyncErrors();
    }
  };

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Belum pernah';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncAt.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-2">
      <View className="flex-row items-center justify-between">
        {/* Connection Status */}
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={getConnectionIcon()}
            size={16}
            color={getConnectionColor()}
          />
          <Text 
            className="ml-2 text-sm font-medium"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </Text>
          
          {isSyncing && (
            <ActivityIndicator 
              size="small" 
              color={COLORS.primary} 
              className="ml-2"
            />
          )}
        </View>

        {/* Sync Actions */}
        <View className="flex-row items-center">
          {/* Last Sync Time */}
          <Text className="text-xs text-gray-500 mr-3">
            {formatLastSync()}
          </Text>

          {/* Sync Button */}
          {(hasPendingData || hasFailedData) && isOnline && (
            <TouchableOpacity
              onPress={handleSyncPress}
              disabled={isSyncing}
              className="flex-row items-center px-2 py-1 rounded"
              style={{ 
                backgroundColor: hasFailedData ? COLORS.warning : COLORS.primary,
                opacity: isSyncing ? 0.6 : 1
              }}
            >
              <Ionicons
                name={hasFailedData ? 'refresh' : 'cloud-upload'}
                size={14}
                color="white"
              />
              <Text className="text-white text-xs ml-1 font-medium">
                {hasFailedData ? 'Retry' : 'Sync'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Detailed Status */}
      {(hasPendingData || hasFailedData || syncErrors.length > 0) && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          {hasPendingData && (
            <Text className="text-xs text-gray-600">
              📤 {pendingCount} item menunggu sinkronisasi
            </Text>
          )}
          
          {hasFailedData && (
            <Text className="text-xs text-orange-600">
              ⚠️ {failedCount} item gagal sinkron (tap Retry)
            </Text>
          )}
          
          {syncErrors.length > 0 && (
            <TouchableOpacity onPress={clearSyncErrors}>
              <Text className="text-xs text-red-600">
                ❌ {syncErrors.length} error sinkronisasi (tap untuk hapus)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};