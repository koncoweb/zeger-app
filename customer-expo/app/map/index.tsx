import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, DEFAULT_REGION } from '@/lib/constants';
import { useLocation } from '@/hooks/useLocation';
import { useNearbyRiders } from '@/hooks/useNearbyRiders';
import { useAuthStore } from '@/store/authStore';
import { supabase, Rider } from '@/lib/supabase';
import { formatPhoneForWhatsApp, getGoogleMapsDirectionsUrl } from '@/lib/utils';
import { NativeMap, NativeMapRef, MapMarker } from '@/components/map/NativeMap';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<NativeMapRef>(null);
  const { customerUser } = useAuthStore();
  
  // Location hook
  const { location, errorMsg, isLoading: locationLoading, refreshLocation } = useLocation();
  
  // Nearby riders hook
  const { 
    riders, 
    isLoading: ridersLoading, 
    error: ridersError, 
    refetch: refetchRiders 
  } = useNearbyRiders(location?.latitude ?? null, location?.longitude ?? null);
  
  // Local state
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !location || riders.length === 0) return;

    const coordinates = [
      { latitude: location.latitude, longitude: location.longitude },
      ...riders
        .filter((r) => r.lat && r.lng)
        .map((r) => ({ latitude: r.lat!, longitude: r.lng! })),
    ];

    if (coordinates.length > 1) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [location, riders]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    await refetchRiders();
    setRefreshing(false);
  }, [refreshLocation, refetchRiders]);

  // Handle rider selection
  const handleRiderSelect = (rider: Rider) => {
    setSelectedRider(rider);
    
    // Animate map to show both user and rider
    if (mapRef.current && location && rider.lat && rider.lng) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: rider.lat, longitude: rider.lng },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  // Handle marker press from map
  const handleMarkerPress = (marker: MapMarker) => {
    const rider = riders.find(r => r.id === marker.id);
    if (rider) {
      handleRiderSelect(rider);
    }
  };

  // Handle visit rider (open Google Maps directions)
  const handleVisitRider = (rider: Rider) => {
    if (!rider.lat || !rider.lng || !location) {
      Alert.alert('Error', 'Lokasi rider tidak tersedia');
      return;
    }

    const url = getGoogleMapsDirectionsUrl(
      location.latitude,
      location.longitude,
      rider.lat,
      rider.lng
    );

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka Google Maps');
    });
  };

  // Handle call rider (send order request)
  const handleCallRider = async (rider: Rider) => {
    if (!customerUser?.user_id || !location) {
      Alert.alert('Error', 'Silakan login terlebih dahulu');
      return;
    }

    setIsRequesting(true);

    try {
      console.log('📞 Calling rider:', {
        rider: rider.full_name,
        customer_user_id: customerUser.user_id,
        location,
      });

      const { data, error } = await supabase.functions.invoke('send-order-request', {
        body: {
          customer_user_id: customerUser.user_id,
          rider_profile_id: rider.id,
          customer_lat: location.latitude,
          customer_lng: location.longitude,
          delivery_address: customerUser.address || 'Alamat pelanggan',
          notes: 'Panggil rider via Zeger On The Wheels',
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Gagal mengirim permintaan');
      }

      console.log('✅ Order created:', data);

      Alert.alert(
        'Berhasil!',
        `Permintaan berhasil dikirim ke ${rider.full_name}!\nETA: ${data.eta_minutes || 15} menit`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/orders' as any);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error calling rider:', error);
      Alert.alert('Gagal', error.message || 'Gagal mengirim permintaan. Silakan coba lagi.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle contact via WhatsApp
  const handleContactWhatsApp = (rider: Rider) => {
    if (!rider.phone) {
      Alert.alert('Error', 'Nomor telepon rider tidak tersedia');
      return;
    }

    const phoneNumber = formatPhoneForWhatsApp(rider.phone);
    const message = 'Halo, saya ingin memesan kopi dari Zeger!';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

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
      isSelected: selectedRider?.id === rider.id,
    }));

  // Route coordinates for selected rider
  const routeCoordinates = selectedRider && location && selectedRider.lat && selectedRider.lng
    ? [
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: selectedRider.lat, longitude: selectedRider.lng },
      ]
    : [];

  // Loading state
  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Mendapatkan lokasi Anda...</Text>
      </View>
    );
  }

  // Error state
  if (errorMsg && !location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color={COLORS.gray[400]} />
        <Text style={styles.errorTitle}>Lokasi Tidak Tersedia</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <NativeMap
          ref={mapRef}
          initialRegion={initialRegion}
          userLocation={location}
          markers={mapMarkers}
          selectedMarkerId={selectedRider?.id}
          onMarkerPress={handleMarkerPress}
          showRoute={!!selectedRider}
          routeCoordinates={routeCoordinates}
        />

        {/* Map Legend - Only show on native */}
        {Platform.OS !== 'web' && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
              <Text style={styles.legendText}>Anda</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Online</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Shift</Text>
            </View>
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Riders List */}
      <ScrollView
        style={styles.ridersList}
        contentContainerStyle={styles.ridersListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.ridersTitle}>
          Rider Terdekat ({riders.length})
        </Text>

        {ridersLoading && (
          <View style={styles.ridersLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.ridersLoadingText}>Mencari rider...</Text>
          </View>
        )}

        {ridersError && (
          <View style={styles.ridersError}>
            <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
            <Text style={styles.ridersErrorText}>{ridersError}</Text>
          </View>
        )}

        {!ridersLoading && riders.length === 0 && !ridersError && (
          <View style={styles.noRiders}>
            <Ionicons name="bicycle-outline" size={48} color={COLORS.gray[400]} />
            <Text style={styles.noRidersText}>Tidak ada rider tersedia</Text>
            <Text style={styles.noRidersSubtext}>Coba lagi nanti</Text>
          </View>
        )}

        {riders.map((rider) => (
          <RiderCard
            key={rider.id}
            rider={rider}
            isSelected={selectedRider?.id === rider.id}
            onSelect={() => handleRiderSelect(rider)}
            onVisit={() => handleVisitRider(rider)}
            onCall={() => handleCallRider(rider)}
            onWhatsApp={() => handleContactWhatsApp(rider)}
            isRequesting={isRequesting}
            hasLocation={!!location}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Rider Card Component
interface RiderCardProps {
  rider: Rider;
  isSelected: boolean;
  onSelect: () => void;
  onVisit: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  isRequesting: boolean;
  hasLocation: boolean;
}

function RiderCard({
  rider,
  isSelected,
  onSelect,
  onVisit,
  onCall,
  onWhatsApp,
  isRequesting,
  hasLocation,
}: RiderCardProps) {
  const getStatusBadge = () => {
    if (!rider.is_shift_active) {
      return { text: 'Offline', color: COLORS.gray[400], icon: 'ellipse' as const };
    }
    if (rider.is_online) {
      return { text: 'Online', color: COLORS.success, icon: 'ellipse' as const };
    }
    return { text: 'Shift Aktif', color: COLORS.warning, icon: 'ellipse' as const };
  };

  const status = getStatusBadge();

  return (
    <TouchableOpacity
      style={[styles.riderCard, isSelected && styles.riderCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.riderCardHeader}>
        <View style={styles.riderAvatar}>
          <Text style={styles.riderAvatarText}>
            {rider.full_name.charAt(0).toUpperCase()}
          </Text>
          <View
            style={[
              styles.riderStatusDot,
              { backgroundColor: rider.is_online ? COLORS.success : COLORS.gray[400] },
            ]}
          />
        </View>

        <View style={styles.riderInfo}>
          <Text style={styles.riderName} numberOfLines={1}>
            {rider.full_name}
          </Text>
          <View style={styles.riderBadges}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={COLORS.yellow[500]} />
              <Text style={styles.ratingText}>{rider.rating.toFixed(1)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Ionicons name={status.icon} size={8} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stockBadge}>
          <Ionicons name="cube-outline" size={14} color={COLORS.gray[600]} />
          <Text style={styles.stockText}>{rider.total_stock}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.riderStats}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color={COLORS.info} />
          <Text style={styles.statValue}>
            {rider.distance_km < 999 ? `${rider.distance_km} km` : 'N/A'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={COLORS.success} />
          <Text style={styles.statValue}>
            {rider.eta_minutes > 0 ? `~${rider.eta_minutes} min` : 'N/A'}
          </Text>
        </View>
      </View>

      {/* GPS Warning */}
      {!rider.has_gps && rider.branch_name && (
        <View style={styles.gpsWarning}>
          <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
          <Text style={styles.gpsWarningText}>
            GPS tidak aktif. Lokasi {rider.branch_name}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.riderActions}>
        <TouchableOpacity
          style={styles.visitButton}
          onPress={onVisit}
          disabled={!rider.lat || !rider.lng || !hasLocation}
        >
          <Ionicons name="navigate" size={16} color={COLORS.gray[700]} />
          <Text style={styles.visitButtonText}>Kunjungi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callButton, isRequesting && styles.callButtonDisabled]}
          onPress={onCall}
          disabled={isRequesting || !hasLocation}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="call" size={16} color={COLORS.white} />
              <Text style={styles.callButtonText}>Panggil</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={onWhatsApp}
          disabled={!rider.phone}
        >
          <Ionicons name="logo-whatsapp" size={16} color={COLORS.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
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
  refreshButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ridersList: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  ridersListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  ridersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  ridersLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  ridersLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray[600],
  },
  ridersError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ridersErrorText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.gray[700],
    flex: 1,
  },
  noRiders: {
    alignItems: 'center',
    padding: 32,
  },
  noRidersText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 12,
  },
  noRidersSubtext: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  riderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riderCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  riderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  riderStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  riderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellow[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginLeft: 4,
  },
  riderStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginLeft: 8,
  },
  gpsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  gpsWarningText: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginLeft: 6,
    flex: 1,
  },
  riderActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  visitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingVertical: 12,
    borderRadius: 24,
  },
  visitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginLeft: 6,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 6,
  },
  whatsappButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
