import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getTodayDate } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface ShiftSummary {
  cashSales: number;
  qrisSales: number;
  transferSales: number;
  totalSales: number;
  transactionCount: number;
  remainingStock: number;
}

export default function ShiftReportScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { activeShift, endShift } = useShiftStore();
  const { stopTracking, getCurrentLocation } = useLocationStore();
  const toast = useToast();

  const [summary, setSummary] = useState<ShiftSummary>({
    cashSales: 0,
    qrisSales: 0,
    transferSales: 0,
    totalSales: 0,
    transactionCount: 0,
    remainingStock: 0,
  });
  const [expenses, setExpenses] = useState('0');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!profile || !activeShift) return;

    try {
      const today = getTodayDate();

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('final_amount, payment_method')
        .eq('rider_id', profile.id)
        .gte('transaction_date', `${today}T00:00:00`)
        .eq('status', 'completed')
        .eq('is_voided', false);

      const cashSales = transactions?.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const qrisSales = transactions?.filter(t => t.payment_method === 'qris').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const transferSales = transactions?.filter(t => t.payment_method === 'transfer').reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      // Fetch remaining stock
      const { data: inventory } = await supabase
        .from('inventory')
        .select('stock_quantity')
        .eq('rider_id', profile.id)
        .gt('stock_quantity', 0);

      const remainingStock = inventory?.reduce((sum, i) => sum + i.stock_quantity, 0) || 0;

      setSummary({
        cashSales,
        qrisSales,
        transferSales,
        totalSales: cashSales + qrisSales + transferSales,
        transactionCount: transactions?.length || 0,
        remainingStock,
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Error', 'Gagal memuat ringkasan shift');
    } finally {
      setLoading(false);
    }
  }, [profile, activeShift]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  const cashDeposit = summary.cashSales - Number(expenses || 0);

  if (loading) {
    return <LoadingScreen message="Memuat ringkasan shift..." />;
  }

  const handleSubmitReport = async () => {
    if (!profile || !activeShift) {
      toast.error('Error', 'Tidak ada shift aktif');
      return;
    }

    if (summary.remainingStock > 0) {
      toast.warning('Stok Belum Diretur', 'Harap retur semua stok sebelum submit laporan');
      return;
    }

    // Take photo of cash deposit
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Error', 'Izin kamera diperlukan untuk foto setoran');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (result.canceled) return;

    setSubmitting(true);

    try {
      // Upload photo
      const photo = result.assets[0];
      const fileName = `report_${activeShift.id}_${Date.now()}.jpg`;
      const filePath = `daily-reports/${profile.id}/${fileName}`;

      const response = await fetch(photo.uri);
      const blob = await response.blob();

      await supabase.storage
        .from('report-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      // Get end location
      const location = await getCurrentLocation();
      const endLocation = location
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        : null;

      // Create daily report
      const { error: reportError } = await supabase.from('daily_reports').insert({
        rider_id: profile.id,
        branch_id: profile.branch_id,
        shift_id: activeShift.id,
        report_date: getTodayDate(),
        total_sales: summary.totalSales,
        cash_collected: cashDeposit,
        total_transactions: summary.transactionCount,
        end_location: endLocation,
        photos: { cash_deposit: `/report-photos/${filePath}` },
      });

      if (reportError) throw reportError;

      // Update shift
      const { error: shiftError } = await supabase
        .from('shift_management')
        .update({
          shift_end_time: new Date().toISOString(),
          status: 'completed',
          cash_collected: cashDeposit,
          total_sales: summary.totalSales,
          total_transactions: summary.transactionCount,
          report_submitted: true,
          notes: expenseNotes || null,
        })
        .eq('id', activeShift.id);

      if (shiftError) throw shiftError;

      // Stop GPS tracking
      stopTracking();

      // End shift in store
      await endShift();

      toast.success('Sukses', 'Laporan shift berhasil disubmit');
      router.back();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error', 'Gagal submit laporan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeShift) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>Tidak Ada Shift Aktif</Text>
          <Text style={styles.emptyText}>Mulai shift terlebih dahulu</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Sales Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Ringkasan Penjualan</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={20} color={COLORS.success} />
              <Text style={styles.summaryLabel}>Tunai</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.cashSales)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="qr-code-outline" size={20} color={COLORS.info} />
              <Text style={styles.summaryLabel}>QRIS</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.qrisSales)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="card-outline" size={20} color={COLORS.warning} />
              <Text style={styles.summaryLabel}>Transfer</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.transferSales)}</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Penjualan</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.totalSales)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jumlah Transaksi</Text>
            <Text style={styles.infoValue}>{summary.transactionCount}</Text>
          </View>
        </Card>

        {/* Stock Status */}
        <Card style={summary.remainingStock > 0 ? [styles.stockCard, styles.stockWarning] : styles.stockCard}>
          <View style={styles.stockHeader}>
            <Ionicons
              name={summary.remainingStock > 0 ? 'warning' : 'checkmark-circle'}
              size={24}
              color={summary.remainingStock > 0 ? COLORS.warning : COLORS.success}
            />
            <View style={styles.stockInfo}>
              <Text style={styles.stockLabel}>Sisa Stok</Text>
              <Text style={styles.stockValue}>{summary.remainingStock} item</Text>
            </View>
          </View>
          {summary.remainingStock > 0 && (
            <Button
              title="Retur Stok"
              variant="outline"
              size="sm"
              onPress={() => router.push('/stock/return')}
            />
          )}
        </Card>

        {/* Expenses */}
        <Card style={styles.expenseCard}>
          <Text style={styles.sectionTitle}>Pengeluaran Operasional</Text>
          <Input
            label="Jumlah Pengeluaran"
            placeholder="0"
            value={expenses}
            onChangeText={setExpenses}
            keyboardType="numeric"
          />
          <Input
            label="Keterangan (Opsional)"
            placeholder="Contoh: Bensin, parkir, dll"
            value={expenseNotes}
            onChangeText={setExpenseNotes}
          />
        </Card>

        {/* Cash Deposit */}
        <Card style={styles.depositCard}>
          <Text style={styles.depositLabel}>Setoran Tunai</Text>
          <Text style={styles.depositValue}>{formatCurrency(cashDeposit)}</Text>
          <Text style={styles.depositFormula}>
            = Penjualan Tunai ({formatCurrency(summary.cashSales)}) - Pengeluaran ({formatCurrency(Number(expenses || 0))})
          </Text>
        </Card>

        {/* Submit Button */}
        <Button
          title="Submit Laporan & Akhiri Shift"
          onPress={handleSubmitReport}
          loading={submitting}
          disabled={summary.remainingStock > 0}
          size="lg"
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />}
        />

        {summary.remainingStock > 0 && (
          <Text style={styles.warningText}>
            * Retur semua stok sebelum submit laporan
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  content: { padding: 16 },
  summaryCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: COLORS.gray[500], marginTop: 4 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900], marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray[200] },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.gray[700] },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoLabel: { fontSize: 14, color: COLORS.gray[500] },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.gray[700] },
  stockCard: { marginBottom: 16 },
  stockWarning: { borderWidth: 1, borderColor: COLORS.warning },
  stockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stockInfo: { flex: 1 },
  stockLabel: { fontSize: 12, color: COLORS.gray[500] },
  stockValue: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  expenseCard: { marginBottom: 16 },
  depositCard: { alignItems: 'center', marginBottom: 24, backgroundColor: COLORS.cream },
  depositLabel: { fontSize: 14, color: COLORS.brown },
  depositValue: { fontSize: 32, fontWeight: '700', color: COLORS.primary, marginVertical: 8 },
  depositFormula: { fontSize: 12, color: COLORS.gray[500], textAlign: 'center' },
  warningText: { fontSize: 12, color: COLORS.warning, textAlign: 'center', marginTop: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 8 },
});
