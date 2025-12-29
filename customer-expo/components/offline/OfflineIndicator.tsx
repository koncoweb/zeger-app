import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../../hooks/useOffline';

interface OfflineIndicatorProps {
  style?: any;
  showWhenOnline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showWhenOnline = false,
}) => {
  const { isOnline, connectionType, connectionQuality } = useOffline();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  const getIndicatorColor = () => {
    if (!isOnline) return '#DC2626'; // Red for offline
    
    switch (connectionQuality) {
      case 'excellent':
        return '#16A34A'; // Green
      case 'good':
        return '#CA8A04'; // Yellow
      case 'poor':
        return '#EA580C'; // Orange
      default:
        return '#DC2626'; // Red
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent':
        return `Online (${connectionType})`;
      case 'good':
        return `Online (${connectionType})`;
      case 'poor':
        return `Koneksi Lemah (${connectionType})`;
      default:
        return 'Tidak Ada Koneksi';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getIndicatorColor() }, style]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineIndicator;