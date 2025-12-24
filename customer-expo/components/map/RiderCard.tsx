import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { Rider } from '@/lib/supabase';
import { formatPhoneForWhatsApp, getGoogleMapsDirectionsUrl } from '@/lib/utils';

interface RiderCardProps {
  rider: Rider;
  userLocation: { latitude: number; longitude: number } | null;
  onCallRider: (rider: Rider) => void;
  isRequesting?: boolean;
}

export const RiderCard: React.FC<RiderCardProps> = ({
  rider,
  userLocation,
  onCallRider,
  isRequesting = false,
}) => {
  const handleVisitRider = () => {
    if (!rider.lat || !rider.lng || !userLocation) {
      Alert.alert('Error', 'Lokasi rider tidak tersedia');
      return;
    }

    const url = getGoogleMapsDirectionsUrl(
      userLocation.latitude,
      userLocation.longitude,
      rider.lat,
      rider.lng
    );

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka Google Maps');
    });
  };

  const handleContactRider = () => {
    if (!rider.phone) {
      Alert.alert('Error', 'Nomor telepon rider tidak tersedia');
      return;
    }

    const phoneNumber = formatPhoneForWhatsApp(rider.phone);
    const url = `https://wa.me/${phoneNumber}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

  const getStatusBadge = () => {
    if (!rider.is_shift_active) {
      return { text: '⚪ Offline', color: COLORS.gray[400] };
    }
    if (rider.is_online) {
      return { text: '🟢 Online', color: COLORS.success };
    }
    return { text: '🟡 Shift Aktif', color: COLORS.warning };
  };

  const status = getStatusBadge();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {rider.photo_url ? (
            <Image source={{ uri: rider.photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {rider.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: rider.is_online ? COLORS.success : COLORS.gray[400] },
            ]}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {rider.full_name}
          </Text>
          <View style={styles.badges}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={COLORS.yellow[500]} />
              <Text style={styles.ratingText}>{rider.rating.toFixed(1)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>
          {!rider.has_gps && rider.branch_name && (
            <View style={styles.locationNote}>
              <Ionicons name="location-outline" size={12} color={COLORS.gray[500]} />
              <Text style={styles.locationNoteText}>Lokasi Cabang</Text>
            </View>
          )}
        </View>

        <View style={styles.stockBadge}>
          <Ionicons name="cube-outline" size={14} color={COLORS.gray[600]} />
          <Text style={styles.stockText}>{rider.total_stock}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
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
            GPS tidak aktif. Menampilkan lokasi {rider.branch_name}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.visitButton}
          onPress={handleVisitRider}
          disabled={!rider.lat || !rider.lng || !userLocation}
        >
          <Ionicons name="navigate" size={16} color={COLORS.gray[700]} />
          <Text style={styles.visitButtonText}>Kunjungi Rider</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callButton, isRequesting && styles.callButtonDisabled]}
          onPress={() => onCallRider(rider)}
          disabled={isRequesting || !userLocation}
        >
          {isRequesting ? (
            <Text style={styles.callButtonText}>Memproses...</Text>
          ) : (
            <>
              <Ionicons name="call" size={16} color={COLORS.white} />
              <Text style={styles.callButtonText}>Panggil Rider</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationNoteText: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginLeft: 4,
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
  stats: {
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
  actions: {
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
});
