import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/performance';
import { StockMovement } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Memoized stock item component
const StockItem = memo(({ 
  item, 
  onConfirm, 
  isConfirming, 
  isDisabled 
}: { 
  item: StockMovement; 
  onConfirm: (movement: StockMovement) => void;
  isConfirming: boolean;
  isDisabled: boolean;
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm(item);
  }, [item, onConfirm]);

  return (
    <Card style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product?.name}</Text>
          <Text style={styles.productCode}>{item.product?.code}</Text>
        </View>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
      </View>

      <View style={styles.stockMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>{formatDateTime(item.created_at)}</Text>
        </View>
        {item.notes && (
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>{item.notes}</Text>
          </View>
        )}
      </View>

      <Button
        title="Konfirmasi Terima"
        onPress={handleConfirm}
        loading={isConfirming}
        disabled={isDisabled}
        size="sm"
        style={styles.confirmButton}
      />
    </Card>
  );
});

StockItem.displayName = 'StockItem';

export default function StockReceiveScreen() {
  const { profile } = useAuthStore();
  const { isShiftActive, startShift } = useShiftStore();
  const toast = useToast();
  const [pendingStock, setPendingStock] = useState<StockMovement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchPendingStock = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, product:products(*)')
        .eq('rider_id', profile.id)
        .eq('status', 'pending')
        .in('movement_type', ['transfer_to_rider', 'transfer'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingStock(data || []);
    } catch (error) {
      console.error('Error fetching pending stock:', error);
      toast.error('Error', 'Gagal memuat stok pending');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchPendingStock();
  }, [fetchPendingStock]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPendingStock();
    setRefreshing(false);
  }, [fetchPendingStock]);

  const handleConfirmStock = async (movement: StockMovement) => {
    if (!profile?.branch_id) return;

    setConfirmingId(movement.id);

    try {
      // Start shift if not active
      if (!isShiftActive) {
        const shiftResult = await startShift(profile.id, profile.branch_id);
        if (shiftResult.error) {
          toast.error('Error', shiftResult.error);
          setConfirmingId(null);
          return;
        }
      }

      // Update stock movement status
      const { error: movementError } = await supabase
        .from('stock_movements')
        .update({
          status: 'received',
          actual_delivery_date: new Date().toISOString(),
        })
        .eq('id', movement.id);

      if (movementError) throw movementError;

      // Update or create inventory
      const { data: existingInventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('product_id', movement.product_id)
        .maybeSingle();

      if (existingInventory) {
        await supabase
          .from('inventory')
          .update({
            stock_quantity: existingInventory.stock_quantity + movement.quantity,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingInventory.id);
      } else {
        await supabase.from('inventory').insert({
          rider_id: profile.id,
          product_id: movement.product_id,
          branch_id: profile.branch_id,
          stock_quantity: movement.quantity,
        });
      }

      toast.success('Sukses', 'Stok berhasil dikonfirmasi');
      fetchPendingStock();
    } catch (error) {
      console.error('Error confirming stock:', error);
      toast.error('Error', 'Gagal mengkonfirmasi stok');
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat stok pending..." />;
  }

  // Memoized render function
  const renderStockItem = useCallback(({ item }: { item: StockMovement }) => (
    <StockItem
      item={item}
      onConfirm={handleConfirmStock}
      isConfirming={confirmingId === item.id}
      isDisabled={confirmingId !== null}
    />
  ), [handleConfirmStock, confirmingId]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: StockMovement) => item.id, []);

  // Memoized empty component
  const EmptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>Tidak Ada Stok Pending</Text>
      <Text style={styles.emptyText}>Semua transfer stok sudah dikonfirmasi</Text>
    </View>
  ), []);

  // Memoized header component
  const HeaderComponent = useMemo(() => (
    pendingStock.length > 0 ? (
      <Text style={styles.headerText}>
        {pendingStock.length} transfer stok menunggu konfirmasi
      </Text>
    ) : null
  ), [pendingStock.length]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={pendingStock}
        renderItem={renderStockItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={EmptyComponent}
        ListHeaderComponent={HeaderComponent}
        {...FLATLIST_PERFORMANCE_CONFIG}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  listContent: { padding: 16, flexGrow: 1 },
  headerText: { fontSize: 14, color: COLORS.gray[600], marginBottom: 12 },
  stockCard: { marginBottom: 12 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  productCode: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  quantityBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quantityText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  stockMeta: { gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.gray[500] },
  confirmButton: { marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 8, textAlign: 'center' },
});
