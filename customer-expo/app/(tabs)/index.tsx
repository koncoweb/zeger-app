import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { customerUser, isAuthenticated } = useAuthStore();

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>ZEGER COFFEE</Text>
          <Text style={styles.heroSubtitle}>Coffee On The Wheels</Text>
        </View>
      </View>

      {/* Member Card */}
      <View style={styles.memberCard}>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            Hi, {customerUser?.name?.toUpperCase() || 'GUEST'}
          </Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Membership Info */}
        <View style={styles.membershipRow}>
          <TouchableOpacity style={styles.membershipItem} onPress={() => handleNavigate('/loyalty')}>
            <View style={styles.membershipIcon}>
              <Ionicons name="flame" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Zeger Loyalty</Text>
            <Text style={styles.membershipValue}>{customerUser?.points || 0} Exp</Text>
          </TouchableOpacity>

          <View style={styles.membershipItem}>
            <View style={styles.membershipIcon}>
              <Ionicons name="wallet" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Zeger Point</Text>
            <Text style={styles.membershipValue}>{formatNumber(customerUser?.points || 0)}</Text>
          </View>

          <TouchableOpacity style={styles.membershipItem} onPress={() => handleNavigate('/vouchers')}>
            <View style={styles.membershipIcon}>
              <Ionicons name="gift" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Voucher</Text>
            <Text style={styles.membershipValue}>0 Voucher</Text>
          </TouchableOpacity>
        </View>

        {/* Order Section Title */}
        <Text style={styles.sectionTitle}>Buat Pesanan Sekarang</Text>

        {/* Order Type Buttons */}
        <View style={styles.orderButtonsRow}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleNavigate('/outlets')}
          >
            <Ionicons name="storefront" size={32} color={COLORS.white} />
            <Text style={styles.orderButtonText}>Zeger Branch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleNavigate('/map')}
          >
            <Ionicons name="bicycle" size={32} color={COLORS.white} />
            <Text style={styles.orderButtonText}>Zeger On The Wheels</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  heroBanner: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  memberCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    minHeight: 400,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  membershipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  membershipItem: {
    alignItems: 'center',
    flex: 1,
  },
  membershipIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  membershipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  membershipValue: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  orderButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});
