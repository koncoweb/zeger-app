// Web fallback - react-native-maps doesn't support web platform
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  label?: string;
  isSelected?: boolean;
}

export interface NativeMapRef {
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
  animateToRegion: (region: any, duration?: number) => void;
}

export interface NativeMapProps {
  initialRegion: any;
  userLocation?: { latitude: number; longitude: number } | null;
  markers?: MapMarker[];
  selectedMarkerId?: string | null;
  onMarkerPress?: (marker: MapMarker) => void;
  showRoute?: boolean;
  routeCoordinates?: { latitude: number; longitude: number }[];
}

export const NativeMap = forwardRef<NativeMapRef, NativeMapProps>((_props, ref) => {
  // Provide no-op implementations for web
  useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {},
    animateToRegion: () => {},
  }));

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="map-outline" size={64} color={COLORS.gray[400]} />
      </View>
      <Text style={styles.title}>Peta Tidak Tersedia di Web</Text>
      <Text style={styles.subtitle}>
        Fitur peta hanya tersedia di aplikasi mobile (iOS/Android).
      </Text>
      <Text style={styles.hint}>
        Silakan gunakan aplikasi di perangkat mobile untuk melihat lokasi rider.
      </Text>
    </View>
  );
});

NativeMap.displayName = 'NativeMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NativeMap;
