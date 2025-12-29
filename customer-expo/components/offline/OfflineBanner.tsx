import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOffline } from '../../hooks/useOffline';
import { useOfflineSync } from '../../hooks/useOfflineSync';

interface OfflineBannerProps {
  style?: any;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ style }) => {
  const { isOnline } = useOffline();
  const { pendingCount, forcSync, canSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const getBannerMessage = () => {
    if (!isOnline) {
      if (pendingCount > 0) {
        return `Mode Offline - ${pendingCount} item menunggu sinkronisasi`;
      }
      return 'Mode Offline - Beberapa fitur mungkin tidak tersedia';
    }
    
    if (pendingCount > 0) {
      return `${pendingCount} item menunggu sinkronisasi`;
    }
    
    return '';
  };

  const handleSyncPress = () => {
    if (canSync) {
      forcSync();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {isOnline ? '🔄' : '📱'}
          </Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.message}>{getBannerMessage()}</Text>
          {!isOnline && (
            <Text style={styles.subtitle}>
              Data yang tersimpan akan disinkronkan saat online
            </Text>
          )}
        </View>
        
        {canSync && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncPress}
          >
            <Text style={styles.syncButtonText}>Sinkronkan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7', // Light yellow background
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Orange border
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E', // Dark yellow text
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#A16207', // Medium yellow text
  },
  syncButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineBanner;