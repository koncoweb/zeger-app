// Web fallback - react-native-maps doesn't support web platform
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
  nearbyRiders?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
    status?: string;
  }>;
  onRiderSelect?: (rider: any) => void;
}

export const NativeMap = forwardRef<NativeMapRef, NativeMapProps>((props, ref) => {
  const { nearbyRiders = [], onRiderSelect, selectedMarkerId } = props;

  // Provide no-op implementations for web
  useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {},
    animateToRegion: () => {},
  }));

  const handleRiderPress = (rider: any) => {
    if (onRiderSelect) {
      onRiderSelect(rider);
    }
  };

  const getDistanceText = (distance?: number) => {
    if (!distance) return 'Jarak tidak diketahui';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available':
        return '#16A34A'; // Green
      case 'busy':
        return '#EA580C'; // Orange
      case 'offline':
        return '#DC2626'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'busy':
        return 'Sibuk';
      case 'offline':
        return 'Offline';
      default:
        return 'Tidak diketahui';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="map-outline" size={32} color={COLORS.gray[400]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Rider Terdekat</Text>
          <Text style={styles.subtitle}>
            Peta tidak tersedia di web, berikut daftar rider terdekat
          </Text>
        </View>
      </View>

      {nearbyRiders.length > 0 ? (
        <ScrollView style={styles.riderList} showsVerticalScrollIndicator={false}>
          {nearbyRiders.map((rider) => (
            <TouchableOpacity
              key={rider.id}
              style={[
                styles.riderCard,
                selectedMarkerId === rider.id && styles.selectedRiderCard,
              ]}
              onPress={() => handleRiderPress(rider)}
            >
              <View style={styles.riderInfo}>
                <View style={styles.riderHeader}>
                  <Text style={styles.riderName}>{rider.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(rider.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(rider.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.riderDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
                    <Text style={styles.detailText}>
                      {getDistanceText(rider.distance)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="navigate-outline" size={16} color={COLORS.gray[500]} />
                    <Text style={styles.detailText}>
                      {rider.latitude.toFixed(4)}, {rider.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.selectButton}>
                <Ionicons 
                  name={selectedMarkerId === rider.id ? "checkmark-circle" : "chevron-forward"} 
                  size={24} 
                  color={selectedMarkerId === rider.id ? "#16A34A" : COLORS.gray[400]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={48} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>Tidak Ada Rider Terdekat</Text>
          <Text style={styles.emptySubtitle}>
            Saat ini tidak ada rider yang tersedia di area Anda
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Install aplikasi mobile untuk pengalaman peta yang lebih baik
        </Text>
      </View>
    </View>
  );
});

NativeMap.displayName = 'NativeMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconContainer: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  riderList: {
    flex: 1,
    padding: 16,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedRiderCard: {
    borderColor: '#16A34A',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  riderInfo: {
    flex: 1,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  riderDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectButton: {
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NativeMap;
