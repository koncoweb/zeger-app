import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { NativeMap } from '@/components/map/NativeMap';

const { width, height } = Dimensions.get('window');

interface Order {
  id: string;
  status: string;
  delivery_address: string;
  latitude: number;
  longitude: number;
  rider_profile_id: string;
  rider?: {
    id: string;
    full_name: string;
    phone: string;
    photo_url?: string;
  };
}

interface RiderLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { customerUser } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      subscribeToOrderUpdates();
      subscribeToRiderLocation();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          rider:profiles!rider_profile_id(
            id,
            full_name,
            phone,
            photo_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);

      // Fetch initial rider location
      if (data.rider_profile_id) {
        fetchRiderLocation(data.rider_profile_id);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderLocation = async (riderId: string) => {
    try {
      const { data, error } = await supabase
        .from('rider_locations')
        .select('latitude, longitude, updated_at')
        .eq('rider_id', riderId)
        .single();

      if (error) throw error;
      if (data) {
        setRiderLocation(data);
        calculateDistanceAndETA(data.latitude, data.longitude);
      }
    } catch (error) {
      console.error('Error fetching rider location:', error);
    }
  };

  const subscribeToOrderUpdates = () => {
    const channel = supabase
      .channel('order_status_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrder(prev => prev ? { ...prev, ...updatedOrder } : null);

          // Show notification for status changes
          if (updatedOrder.status === 'delivered') {
            Alert.alert(
              '🎉 Pesanan Telah Sampai!',
              'Rider telah menyelesaikan pengiriman. Selamat menikmati!',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/orders' as any),
                },
              ]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToRiderLocation = () => {
    if (!order?.rider_profile_id) return;

    const channel = supabase
      .channel('rider_location_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rider_locations',
          filter: `rider_id=eq.${order.rider_profile_id}`,
        },
        (payload) => {
          const newLocation = payload.new as RiderLocation;
          setRiderLocation(newLocation);
          calculateDistanceAndETA(newLocation.latitude, newLocation.longitude);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateDistanceAndETA = (riderLat: number, riderLng: number) => {
    if (!order?.latitude || !order?.longitude) return;

    // Haversine formula for distance calculation
    const R = 6371; // Earth radius in km
    const dLat = (order.latitude - riderLat) * Math.PI / 180;
    const dLon = (order.longitude - riderLng) * Math.PI / 180;
    const lat1 = riderLat * Math.PI / 180;
    const lat2 = order.latitude * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(dist);
    
    // Calculate ETA (assuming average speed of 20 km/h)
    const estimatedTime = (dist / 20) * 60;
    setEta(Math.ceil(estimatedTime));
  };

  const handleCallRider = () => {
    if (!order?.rider?.phone) {
      Alert.alert('Error', 'Nomor telepon rider tidak tersedia');
      return;
    }

    // Format phone number for WhatsApp
    let phoneNumber = order.rider.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

  const getStatusText = () => {
    switch (order?.status) {
      case 'pending':
        return 'Mencari rider terdekat...';
      case 'accepted':
        return 'Rider sedang menuju lokasi Anda';
      case 'in_progress':
        return 'Rider dalam perjalanan ke lokasi Anda';
      case 'delivered':
        return 'Pesanan telah sampai! 🎉';
      case 'completed':
        return 'Pesanan selesai';
      default:
        return 'Memproses pesanan...';
    }
  };

  const getStatusColor = () => {
    switch (order?.status) {
      case 'delivered':
      case 'completed':
        return COLORS.success;
      case 'in_progress':
      case 'accepted':
        return COLORS.primary;
      default:
        return COLORS.warning;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat tracking...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Pesanan tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lacak Pesanan</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {riderLocation && order.latitude && order.longitude ? (
          <NativeMap
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: (riderLocation.latitude + order.latitude) / 2,
              longitude: (riderLocation.longitude + order.longitude) / 2,
              latitudeDelta: Math.abs(riderLocation.latitude - order.latitude) * 2 + 0.01,
              longitudeDelta: Math.abs(riderLocation.longitude - order.longitude) * 2 + 0.01,
            }}
            markers={[
              {
                id: 'rider',
                latitude: riderLocation.latitude,
                longitude: riderLocation.longitude,
                title: order.rider?.full_name || 'Rider',
                description: 'Lokasi Rider',
                color: COLORS.primary,
                icon: 'bicycle',
              },
              {
                id: 'customer',
                latitude: order.latitude,
                longitude: order.longitude,
                title: 'Tujuan',
                description: order.delivery_address,
                color: COLORS.success,
                icon: 'location',
              },
            ]}
            showsUserLocation={false}
            showsMyLocationButton={false}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color={COLORS.gray[400]} />
            <Text style={styles.mapPlaceholderText}>Memuat peta...</Text>
          </View>
        )}
      </View>

      {/* Bottom Info Card */}
      <View style={styles.infoCard}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* ETA */}
        {eta && (
          <View style={styles.etaContainer}>
            <Ionicons name="time" size={20} color={COLORS.gray[600]} />
            <Text style={styles.etaText}>Estimasi: {eta} menit</Text>
          </View>
        )}

        {/* Distance */}
        {distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={20} color={COLORS.gray[600]} />
            <Text style={styles.distanceText}>Jarak: {distance.toFixed(1)} km</Text>
          </View>
        )}

        {/* Rider Info */}
        {order.rider && (
          <View style={styles.riderContainer}>
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>{order.rider.full_name}</Text>
                <Text style={styles.riderStatus}>Rider Zeger</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.callButtonText}>Hubungi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={20} color={COLORS.gray[600]} />
          <Text style={styles.addressText}>{order.delivery_address}</Text>
        </View>
      </View>
    </View>
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
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.gray[700],
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  mapContainer: {
    height: height * 0.4,
    backgroundColor: COLORS.gray[200],
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  etaText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 8,
  },
  riderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  riderStatus: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: 8,
    flex: 1,
  },
});