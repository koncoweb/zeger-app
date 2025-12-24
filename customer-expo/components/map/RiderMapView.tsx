// Re-export the platform-specific NativeMap component
// This file provides a convenient wrapper for the map functionality
import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { COLORS, DEFAULT_REGION } from '@/lib/constants';
import { Rider } from '@/lib/supabase';
import { NativeMap, NativeMapRef, MapMarker } from './NativeMap';

interface RiderMapViewProps {
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  riders: Rider[];
  selectedRiderId?: string | null;
  onRiderSelect?: (rider: Rider) => void;
  showRoute?: boolean;
  isLoading?: boolean;
}

export const RiderMapView: React.FC<RiderMapViewProps> = ({
  userLocation,
  riders,
  selectedRiderId,
  onRiderSelect,
  showRoute = false,
  isLoading = false,
}) => {
  const mapRef = useRef<NativeMapRef>(null);

  // Calculate initial region based on user location
  const initialRegion = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return DEFAULT_REGION;
  }, [userLocation]);

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !userLocation || riders.length === 0) return;

    const coordinates = [
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      ...riders
        .filter((r) => r.lat && r.lng)
        .map((r) => ({ latitude: r.lat!, longitude: r.lng! })),
    ];

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  }, [userLocation, riders]);

  // Get selected rider for route
  const selectedRider = useMemo(() => {
    if (!selectedRiderId) return null;
    return riders.find((r) => r.id === selectedRiderId);
  }, [selectedRiderId, riders]);

  // Get marker color based on rider status
  const getRiderMarkerColor = (rider: Rider): string => {
    if (!rider.is_shift_active) return COLORS.gray[400];
    if (rider.is_online) return COLORS.success;
    return COLORS.warning;
  };

  // Convert riders to map markers
  const mapMarkers: MapMarker[] = riders
    .filter(r => r.lat && r.lng)
    .map(rider => ({
      id: rider.id,
      latitude: rider.lat!,
      longitude: rider.lng!,
      title: rider.full_name,
      description: `${rider.distance_km} km • ${rider.eta_minutes} menit`,
      color: getRiderMarkerColor(rider),
      label: rider.full_name.charAt(0).toUpperCase(),
      isSelected: rider.id === selectedRiderId,
    }));

  // Handle marker press
  const handleMarkerPress = (marker: MapMarker) => {
    const rider = riders.find(r => r.id === marker.id);
    if (rider && onRiderSelect) {
      onRiderSelect(rider);
    }
  };

  // Route coordinates
  const routeCoordinates = showRoute && userLocation && selectedRider?.lat && selectedRider?.lng
    ? [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: selectedRider.lat, longitude: selectedRider.lng },
      ]
    : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat peta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NativeMap
        ref={mapRef}
        initialRegion={initialRegion}
        userLocation={userLocation}
        markers={mapMarkers}
        selectedMarkerId={selectedRiderId}
        onMarkerPress={handleMarkerPress}
        showRoute={showRoute}
        routeCoordinates={routeCoordinates}
      />

      {/* Map Legend - Only show on native */}
      {Platform.OS !== 'web' && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
            <Text style={styles.legendText}>Lokasi Anda</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Online</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>Shift Aktif</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.gray[400] }]} />
            <Text style={styles.legendText}>Offline</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[600],
  },
  legend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.gray[700],
  },
});

export default RiderMapView;
