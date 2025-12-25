import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'shipping';
  discount_value: number;
  min_order: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface UserVoucher {
  id: string;
  voucher_id: string;
  is_used: boolean;
  claimed_at: string;
  used_at?: string;
  voucher: Voucher;
}

export default function PromoScreen() {
  const { customerUser } = useAuthStore();
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucher[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVouchers();
    if (customerUser) {
      fetchMyVouchers();
    }
  }, [customerUser]);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_vouchers')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyVouchers = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_user_vouchers')
        .select(`
          *,
          voucher:customer_vouchers(*)
        `)
        .eq('user_id', customerUser.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setMyVouchers(data || []);
    } catch (error) {
      console.error('Error fetching my vouchers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVouchers(), fetchMyVouchers()]);
    setRefreshing(false);
  };

  const handleClaimVoucher = async (voucher: Voucher) => {
    if (!customerUser?.id) {
      Alert.alert('Login Required', 'Silakan login untuk mengklaim voucher');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_user_vouchers')
        .insert({
          user_id: customerUser.id,
          voucher_id: voucher.id,
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Info', 'Voucher sudah diklaim sebelumnya');
        } else {
          throw error;
        }
        return;
      }

      Alert.alert('Berhasil!', `Voucher ${voucher.code} berhasil diklaim`);
      fetchMyVouchers();
    } catch (error) {
      console.error('Error claiming voucher:', error);
      Alert.alert('Error', 'Gagal mengklaim voucher');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Promo & Voucher</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Tersedia ({availableVouchers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            Voucher Saya ({myVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {activeTab === 'available' ? (
          availableVouchers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>Belum Ada Promo</Text>
              <Text style={styles.emptyText}>
                Promo dan voucher menarik akan muncul di sini
              </Text>
            </View>
          ) : (
            availableVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onClaim={() => handleClaimVoucher(voucher)}
                showClaimButton={true}
              />
            ))
          )
        ) : (
          myVouchers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>Belum Ada Voucher</Text>
              <Text style={styles.emptyText}>
                Voucher yang diklaim akan muncul di sini
              </Text>
            </View>
          ) : (
            myVouchers.map((userVoucher) => (
              <VoucherCard
                key={userVoucher.id}
                voucher={userVoucher.voucher}
                isUsed={userVoucher.is_used}
                usedAt={userVoucher.used_at}
                showClaimButton={false}
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

interface VoucherCardProps {
  voucher: Voucher;
  onClaim?: () => void;
  showClaimButton: boolean;
  isUsed?: boolean;
  usedAt?: string;
}

function VoucherCard({ voucher, onClaim, showClaimButton, isUsed, usedAt }: VoucherCardProps) {
  const isExpired = new Date(voucher.valid_until) < new Date();
  const discountText = voucher.discount_type === 'percentage' 
    ? `${voucher.discount_value}% OFF`
    : voucher.discount_type === 'fixed'
    ? `${formatCurrency(voucher.discount_value)} OFF`
    : 'GRATIS ONGKIR';

  const iconName = voucher.discount_type === 'percentage' 
    ? 'pricetag'
    : voucher.discount_type === 'fixed'
    ? 'cash'
    : 'bicycle';

  const iconColor = voucher.discount_type === 'percentage' 
    ? COLORS.primary
    : voucher.discount_type === 'fixed'
    ? COLORS.success
    : COLORS.info;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.voucherCard, (isExpired || isUsed) && styles.voucherCardDisabled]}>
      <View style={styles.voucherHeader}>
        <View style={[styles.voucherIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View style={styles.voucherInfo}>
          <Text style={[styles.voucherCode, (isExpired || isUsed) && styles.voucherCodeDisabled]}>
            {voucher.code}
          </Text>
          <Text style={[styles.voucherDiscount, (isExpired || isUsed) && styles.voucherDiscountDisabled]}>
            {discountText}
          </Text>
        </View>
        {isUsed && (
          <View style={styles.usedBadge}>
            <Text style={styles.usedBadgeText}>TERPAKAI</Text>
          </View>
        )}
        {isExpired && !isUsed && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredBadgeText}>EXPIRED</Text>
          </View>
        )}
      </View>

      <Text style={[styles.voucherDescription, (isExpired || isUsed) && styles.voucherDescriptionDisabled]}>
        {voucher.description}
      </Text>

      <View style={styles.voucherFooter}>
        <View style={styles.voucherDetails}>
          {voucher.min_order > 0 && (
            <Text style={styles.voucherMinOrder}>
              Min. pembelian {formatCurrency(voucher.min_order)}
            </Text>
          )}
          <Text style={styles.voucherExpiry}>
            Berlaku hingga {formatDate(voucher.valid_until)}
          </Text>
          {isUsed && usedAt && (
            <Text style={styles.voucherUsedAt}>
              Digunakan pada {formatDate(usedAt)}
            </Text>
          )}
        </View>

        {showClaimButton && !isExpired && (
          <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
            <Text style={styles.claimButtonText}>Klaim</Text>
          </TouchableOpacity>
        )}
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
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  voucherCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  voucherCardDisabled: {
    opacity: 0.6,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  voucherCodeDisabled: {
    color: COLORS.gray[500],
  },
  voucherDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  voucherDiscountDisabled: {
    color: COLORS.gray[400],
  },
  usedBadge: {
    backgroundColor: COLORS.gray[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  expiredBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  voucherDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  voucherDescriptionDisabled: {
    color: COLORS.gray[400],
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  voucherDetails: {
    flex: 1,
  },
  voucherMinOrder: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  voucherExpiry: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  voucherUsedAt: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
});
