import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { COLORS } from '@/lib/constants';

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
}

export function OfflineIndicator({ showPendingCount = true }: OfflineIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, hasPendingData, syncAll } = useOffline();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOnline || isSyncing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, isSyncing]);

  // Don't show if online and no pending data
  if (isOnline && !hasPendingData && !isSyncing) {
    return null;
  }

  const handlePress = () => {
    if (isOnline && hasPendingData) {
      syncAll();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={!isOnline || isSyncing}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={[
          styles.container,
          !isOnline && styles.offline,
          isSyncing && styles.syncing,
          { opacity: pulseAnim }
        ]}
      >
        <Ionicons
          name={!isOnline ? 'cloud-offline' : isSyncing ? 'sync' : 'cloud-upload'}
          size={16}
          color={COLORS.white}
        />
        <Text style={styles.text}>
          {!isOnline 
            ? 'Offline' 
            : isSyncing 
              ? 'Sinkronisasi...' 
              : `${pendingCount} menunggu`}
        </Text>
        {showPendingCount && hasPendingData && isOnline && !isSyncing && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  offline: {
    backgroundColor: COLORS.error,
  },
  syncing: {
    backgroundColor: COLORS.info,
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.white,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '700',
  },
});
