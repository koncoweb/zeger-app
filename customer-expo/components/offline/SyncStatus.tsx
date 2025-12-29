import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useOfflineSync } from '../../hooks/useOfflineSync';

interface SyncStatusProps {
  style?: any;
  showWhenIdle?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  style,
  showWhenIdle = false,
}) => {
  const {
    isSyncing,
    syncProgress,
    syncError,
    pendingCount,
    lastSyncTime,
  } = useOfflineSync();

  if (!isSyncing && !syncError && !showWhenIdle) {
    return null;
  }

  const formatLastSyncTime = (timestamp: number) => {
    if (!timestamp) return 'Belum pernah sinkronisasi';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  const getStatusColor = () => {
    if (syncError) return '#DC2626'; // Red
    if (isSyncing) return '#2563EB'; // Blue
    return '#16A34A'; // Green
  };

  const getStatusText = () => {
    if (syncError) return 'Sinkronisasi gagal';
    if (isSyncing) return 'Menyinkronkan data...';
    if (pendingCount > 0) return `${pendingCount} item menunggu`;
    return 'Semua data tersinkronisasi';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          {isSyncing && (
            <ActivityIndicator
              size="small"
              color={getStatusColor()}
              style={styles.spinner}
            />
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {!isSyncing && (
          <Text style={styles.lastSyncText}>
            {formatLastSyncTime(lastSyncTime)}
          </Text>
        )}
      </View>

      {isSyncing && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${syncProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(syncProgress)}%
          </Text>
        </View>
      )}

      {syncError && (
        <Text style={styles.errorText}>
          {syncError}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  spinner: {
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 35,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 16,
  },
});

export default SyncStatus;