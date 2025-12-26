import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useLocationStore } from '@/store/locationStore';

export const GPSIndicator = () => {
  const { isTracking, lastUpdate, error } = useLocationStore();

  const getStatus = () => {
    if (error) {
      return { color: COLORS.error, icon: 'location-outline' as const, text: 'GPS Error' };
    }
    if (!isTracking) {
      return { color: COLORS.gray[400], icon: 'location-outline' as const, text: 'GPS Off' };
    }
    if (lastUpdate) {
      const diff = Date.now() - lastUpdate.getTime();
      if (diff < 60000) {
        return { color: COLORS.success, icon: 'location' as const, text: 'GPS Aktif' };
      }
      return { color: COLORS.warning, icon: 'location' as const, text: 'GPS Delay' };
    }
    return { color: COLORS.warning, icon: 'location-outline' as const, text: 'Menunggu...' };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      <Ionicons name={status.icon} size={16} color={status.color} />
      <Text style={[styles.text, { color: status.color }]}>{status.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
