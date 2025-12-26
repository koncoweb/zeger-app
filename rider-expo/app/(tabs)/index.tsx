import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getTodayDate } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { GPSIndicator } from '@/components/common/GPSIndicator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DashboardStats } from '@/lib/types';

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const { activeShift, isShiftActive, fetchActiveShift, startShift } = useShiftStore();
  const { startTracking, stopTracking, isTracking } = useLocationStore();
  const toast = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    transactionCount: 0,
    stockCount: 0,
    pendingOrders: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      const today = getTodayDate();

      // Fetch today's transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('final_amount')
        .eq('rider_id', profile.id)
        .gte('transaction_date', `${today}T00:00:00`)
        .lt('transaction_date', `${today}T23:59:59`)
        .eq('status', 'completed')
        .eq('is_voided', false);

      const totalSales = transactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const transactionCount = transactions?.length || 0;

      // Fetch rider inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('stock_quantity')
        .eq('rider_id', profile.id)
        .gt('stock_quantity', 0);

      const stockCount = inventory?.reduce((sum, i) => sum + i.stock_quantity, 0) || 0;

      // Fetch pending orders
      const { count: pendingOrders } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('rider_profile_id', profile.id)
        .in('status', ['pending', 'accepted']);

      setStats({
        totalSales,
        transactionCount,
        stockCount,
        pendingOrders: pendingOrders || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error', 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      profile && fetchActiveShift(profile.id),
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchActiveShift, profile]);

  useEffect(() => {
    if (profile) {
      fetchActiveShift(profile.id);
      fetchDashboardData();
    }
  }, [profile, fetchActiveShift, fetchDashboardData]);

  // Start GPS tracking when shift is active
  useEffect(() => {
    if (isShiftActive && profile && !isTracking) {
      startTracking(profile.id);
    } else if (!isShiftActive && isTracking) {
      stopTracking();
    }
  }, [isShiftActive, profile, isTracking, startTracking, stopTracking]);

  // Memoize formatted values to prevent recalculation on every render
  const formattedSales = useMemo(() => formatCurrency(stats.totalSales), [stats.totalSales]);
  const firstName = useMemo(() => profile?.full_name?.split(' ')[0], [profile?.full_name]);
  const branchName = useMemo(() => profile?.branch?.name || 'Branch', [profile?.branch?.name]);
  const shiftInfo = useMemo(() => {
    if (!activeShift?.shift_start_time) return null;
    return `Shift #${activeShift.shift_number} • Mulai ${new Date(activeShift.shift_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }, [activeShift?.shift_number, activeShift?.shift_start_time]);

  const handleStartShift = useCallback(async () => {
    if (!profile?.branch_id) {
      toast.error('Error', 'Branch tidak ditemukan');
      return;
    }

    const result = await startShift(profile.id, profile.branch_id);
    if (result.error) {
      toast.error('Error', result.error);
    } else {
      toast.success('Sukses', 'Shift berhasil dimulai');
      fetchDashboardData();
    }
  }, [profile, startShift, toast, fetchDashboardData]);

  if (loading) {
    return <LoadingScreen message="Memuat dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header Info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, {firstName}!</Text>
            <Text style={styles.branchName}>{branchName}</Text>
          </View>
          <GPSIndicator />
        </View>

        {/* Shift Status */}
        <Card style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftTitle}>Status Shift</Text>
            <View style={[styles.shiftBadge, isShiftActive ? styles.shiftActive : styles.shiftInactive]}>
              <Text style={styles.shiftBadgeText}>
                {isShiftActive ? 'Aktif' : 'Tidak Aktif'}
              </Text>
            </View>
          </View>
          {isShiftActive && shiftInfo ? (
            <Text style={styles.shiftInfo}>{shiftInfo}</Text>
          ) : (
            <Button
              title="Mulai Shift"
              onPress={handleStartShift}
              size="sm"
              style={styles.startShiftButton}
            />
          )}
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Penjualan"
            value={formattedSales}
            icon="cash-outline"
            color={COLORS.success}
          />
          <StatCard
            title="Transaksi"
            value={stats.transactionCount}
            icon="receipt-outline"
            color={COLORS.info}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Stok"
            value={stats.stockCount}
            icon="cube-outline"
            color={COLORS.warning}
          />
          <StatCard
            title="Pesanan"
            value={stats.pendingOrders}
            icon="notifications-outline"
            color={COLORS.primary}
            subtitle="menunggu"
          />
        </View>

        {/* Quick Actions */}
        <QuickActions />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  branchName: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  shiftCard: {
    marginBottom: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  shiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shiftActive: {
    backgroundColor: `${COLORS.success}20`,
  },
  shiftInactive: {
    backgroundColor: COLORS.gray[200],
  },
  shiftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  shiftInfo: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  startShiftButton: {
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
});
