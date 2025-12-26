import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getTodayDate } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

type PeriodType = 'today' | 'yesterday' | 'week' | 'month';

interface AnalyticsData {
  totalSales: number;
  transactionCount: number;
  avgTransaction: number;
  cashSales: number;
  qrisSales: number;
  transferSales: number;
  topProducts: { name: string; quantity: number; total: number }[];
}

// Memoized product row component
const ProductRow = memo(({ product, index }: { product: { name: string; quantity: number; total: number }; index: number }) => (
  <View style={styles.productRow}>
    <View style={styles.productRank}>
      <Text style={styles.rankText}>{index + 1}</Text>
    </View>
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productQty}>{product.quantity} terjual</Text>
    </View>
    <Text style={styles.productTotal}>{formatCurrency(product.total)}</Text>
  </View>
));

ProductRow.displayName = 'ProductRow';

// Memoized payment breakdown item
const PaymentBreakdownItem = memo(({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: number; 
  color: string;
}) => (
  <View style={styles.breakdownItem}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={styles.breakdownLabel}>{label}</Text>
    <Text style={styles.breakdownValue}>{formatCurrency(value)}</Text>
  </View>
));

PaymentBreakdownItem.displayName = 'PaymentBreakdownItem';

export default function AnalyticsScreen() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodType>('today');
  const [data, setData] = useState<AnalyticsData>({
    totalSales: 0,
    transactionCount: 0,
    avgTransaction: 0,
    cashSales: 0,
    qrisSales: 0,
    transferSales: 0,
    topProducts: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getDateRange = (p: PeriodType): { start: string; end: string } => {
    const today = new Date();
    const todayStr = getTodayDate();

    switch (p) {
      case 'today':
        return { start: `${todayStr}T00:00:00`, end: `${todayStr}T23:59:59` };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return { start: `${yesterdayStr}T00:00:00`, end: `${yesterdayStr}T23:59:59` };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo.toISOString(), end: today.toISOString() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo.toISOString(), end: today.toISOString() };
    }
  };

  const fetchAnalytics = useCallback(async () => {
    if (!profile) return;

    try {
      const { start, end } = getDateRange(period);

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, final_amount, payment_method')
        .eq('rider_id', profile.id)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .eq('status', 'completed')
        .eq('is_voided', false);

      const totalSales = transactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const transactionCount = transactions?.length || 0;
      const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

      const cashSales = transactions?.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const qrisSales = transactions?.filter(t => t.payment_method === 'qris').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const transferSales = transactions?.filter(t => t.payment_method === 'transfer').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      // Fetch top products
      const transactionIds = transactions?.map(t => t.id) || [];
      let topProducts: AnalyticsData['topProducts'] = [];

      if (transactionIds.length > 0) {
        const { data: items } = await supabase
          .from('transaction_items')
          .select('quantity, total_price, product:products(name)')
          .in('transaction_id', transactionIds);

        if (items) {
          const productMap = new Map<string, { quantity: number; total: number }>();
          items.forEach(item => {
            const name = (item.product as any)?.name || 'Unknown';
            const existing = productMap.get(name) || { quantity: 0, total: 0 };
            productMap.set(name, {
              quantity: existing.quantity + item.quantity,
              total: existing.total + Number(item.total_price),
            });
          });

          topProducts = Array.from(productMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
        }
      }

      setData({
        totalSales,
        transactionCount,
        avgTransaction,
        cashSales,
        qrisSales,
        transferSales,
        topProducts,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error', 'Gagal memuat data analitik');
    } finally {
      setLoading(false);
    }
  }, [profile, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  // Memoize formatted values
  const formattedTotalSales = useMemo(() => formatCurrency(data.totalSales), [data.totalSales]);
  const formattedAvgTransaction = useMemo(() => formatCurrency(data.avgTransaction), [data.avgTransaction]);

  const periods: { key: PeriodType; label: string }[] = useMemo(() => [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: 'week', label: '7 Hari' },
    { key: 'month', label: '30 Hari' },
  ], []);

  if (loading) {
    return <LoadingScreen message="Memuat analitik..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Period Tabs */}
      <View style={styles.tabs}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formattedTotalSales}</Text>
            <Text style={styles.summaryLabel}>Total Penjualan</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{data.transactionCount}</Text>
            <Text style={styles.summaryLabel}>Transaksi</Text>
          </Card>
        </View>

        <Card style={styles.avgCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.success} />
          <View style={styles.avgInfo}>
            <Text style={styles.avgLabel}>Rata-rata Transaksi</Text>
            <Text style={styles.avgValue}>{formattedAvgTransaction}</Text>
          </View>
        </Card>

        {/* Payment Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <View style={styles.breakdownRow}>
            <PaymentBreakdownItem icon="cash-outline" label="Tunai" value={data.cashSales} color={COLORS.success} />
            <PaymentBreakdownItem icon="qr-code-outline" label="QRIS" value={data.qrisSales} color={COLORS.info} />
            <PaymentBreakdownItem icon="card-outline" label="Transfer" value={data.transferSales} color={COLORS.warning} />
          </View>
        </Card>

        {/* Top Products */}
        <Card style={styles.productsCard}>
          <Text style={styles.sectionTitle}>Produk Terlaris</Text>
          {data.topProducts.length > 0 ? (
            data.topProducts.map((product, index) => (
              <ProductRow key={product.name} product={product} index={index} />
            ))
          ) : (
            <Text style={styles.emptyText}>Belum ada data penjualan</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray[200] },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.gray[500] },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  content: { padding: 16 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.gray[900] },
  summaryLabel: { fontSize: 12, color: COLORS.gray[500], marginTop: 4 },
  avgCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avgInfo: { flex: 1 },
  avgLabel: { fontSize: 12, color: COLORS.gray[500] },
  avgValue: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900] },
  breakdownCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownItem: { alignItems: 'center', flex: 1 },
  breakdownLabel: { fontSize: 12, color: COLORS.gray[500], marginTop: 4 },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900], marginTop: 2 },
  productsCard: {},
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray[100], justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 12, fontWeight: '600', color: COLORS.gray[600] },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, color: COLORS.gray[800] },
  productQty: { fontSize: 12, color: COLORS.gray[500] },
  productTotal: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  emptyText: { fontSize: 14, color: COLORS.gray[400], textAlign: 'center', paddingVertical: 16 },
});
