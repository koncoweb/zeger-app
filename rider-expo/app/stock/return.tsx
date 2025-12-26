import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';
import { Inventory } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StockReturnScreen() {
  const { profile } = useAuthStore();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .eq('rider_id', profile.id)
        .gt('stock_quantity', 0)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, [fetchInventory]);

  const handleReturnStock = async (inv: Inventory) => {
    if (!profile?.branch_id) return;

    // Request camera permission and take photo
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Izin kamera diperlukan untuk foto verifikasi');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled) return;

    setReturningId(inv.id);

    try {
      // Upload photo
      const photo = result.assets[0];
      const fileName = `return_${inv.id}_${Date.now()}.jpg`;
      const filePath = `stock-returns/${profile.id}/${fileName}`;

      const response = await fetch(photo.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('stock-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      let photoUrl = null;
      if (!uploadError) {
        photoUrl = `/stock-photos/${filePath}`;
      }

      // Create stock movement for return
      const { error: movementError } = await supabase.from('stock_movements').insert({
        product_id: inv.product_id,
        branch_id: profile.branch_id,
        rider_id: profile.id,
        movement_type: 'return',
        quantity: inv.stock_quantity,
        status: 'returned',
        verification_photo_url: photoUrl,
        notes: 'Retur stok akhir shift',
        created_by: profile.id,
      });

      if (movementError) throw movementError;

      // Update inventory to zero
      const { error: invError } = await supabase
        .from('inventory')
        .update({ stock_quantity: 0, last_updated: new Date().toISOString() })
        .eq('id', inv.id);

      if (invError) throw invError;

      Alert.alert('Sukses', 'Stok berhasil diretur');
      fetchInventory();
    } catch (error) {
      console.error('Error returning stock:', error);
      Alert.alert('Error', 'Gagal meretur stok');
    } finally {
      setReturningId(null);
    }
  };

  const handleReturnAll = () => {
    Alert.alert(
      'Retur Semua Stok',
      'Apakah Anda yakin ingin meretur semua stok? Anda perlu mengambil foto untuk setiap produk.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Retur Semua',
          onPress: async () => {
            for (const inv of inventory) {
              await handleReturnStock(inv);
            }
          },
        },
      ]
    );
  };

  const totalStock = inventory.reduce((sum, i) => sum + i.stock_quantity, 0);

  const renderInventoryItem = ({ item }: { item: Inventory }) => (
    <Card style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product?.name}</Text>
          <Text style={styles.productCode}>{item.product?.code}</Text>
        </View>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.stock_quantity}</Text>
        </View>
      </View>

      <Button
        title="Retur Stok"
        variant="outline"
        onPress={() => handleReturnStock(item)}
        loading={returningId === item.id}
        disabled={returningId !== null}
        size="sm"
        icon={<Ionicons name="camera-outline" size={16} color={COLORS.primary} />}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {inventory.length > 0 && (
        <View style={styles.summaryBar}>
          <View>
            <Text style={styles.summaryLabel}>Total Stok Tersisa</Text>
            <Text style={styles.summaryValue}>{totalStock} item</Text>
          </View>
          <Button
            title="Retur Semua"
            variant="danger"
            size="sm"
            onPress={handleReturnAll}
            disabled={returningId !== null}
          />
        </View>
      )}

      <FlatList
        data={inventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>Semua Stok Sudah Diretur</Text>
            <Text style={styles.emptyText}>Anda dapat submit laporan shift sekarang</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  summaryLabel: { fontSize: 12, color: COLORS.gray[500] },
  summaryValue: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  listContent: { padding: 16, flexGrow: 1 },
  stockCard: { marginBottom: 12 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  productCode: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  quantityBadge: { backgroundColor: COLORS.warning, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quantityText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 8, textAlign: 'center' },
});
