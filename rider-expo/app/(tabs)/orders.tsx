import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, openGoogleMaps } from '@/lib/utils';
import { COLORS, ORDER_STATUS } from '@/lib/constants';
import { CustomerOrder } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type TabType = 'pending' | 'active' | 'completed';

export default function OrdersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;

    try {
      let statusFilter: string[] = [];
      switch (activeTab) {
        case 'pending':
          statusFilter = ['pending'];
          break;
        case 'active':
          statusFilter = ['accepted', 'on_delivery'];
          break;
        case 'completed':
          statusFilter = ['completed', 'rejected', 'cancelled'];
          break;
      }

      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          items:customer_order_items(*, product:products(*)),
          customer_user:customer_users(id, name, phone, address)
        `)
        .eq('rider_profile_id', profile.id)
        .in('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('rider-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders',
          filter: `rider_profile_id=eq.${profile.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      Alert.alert('Sukses', 'Pesanan diterima');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Gagal menerima pesanan');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    Alert.prompt(
      'Tolak Pesanan',
      'Masukkan alasan penolakan:',
      async (reason) => {
        if (!reason) return;
        try {
          const { error } = await supabase
            .from('customer_orders')
            .update({
              status: 'rejected',
              rejection_reason: reason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) throw error;
          Alert.alert('Sukses', 'Pesanan ditolak');
          fetchOrders();
        } catch (error) {
          Alert.alert('Error', 'Gagal menolak pesanan');
        }
      },
      'plain-text'
    );
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      Alert.alert('Sukses', 'Pesanan selesai');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyelesaikan pesanan');
    }
  };

  const handleNavigate = (order: CustomerOrder) => {
    if (order.latitude && order.longitude) {
      openGoogleMaps(order.latitude, order.longitude);
    } else {
      Alert.alert('Error', 'Lokasi tidak tersedia');
    }
  };

  const renderOrder = ({ item: order }: { item: CustomerOrder }) => {
    const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;
    const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

    return (
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatDateTime(order.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.customerName}>{order.customer_user?.name || 'Customer'}</Text>
        </View>

        {order.delivery_address && (
          <View style={styles.addressInfo}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.addressText} numberOfLines={2}>{order.delivery_address}</Text>
          </View>
        )}

        <View style={styles.orderSummary}>
          <Text style={styles.itemCount}>{itemCount} item</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.total_price)}</Text>
        </View>

        <View style={styles.orderActions}>
          {order.status === 'pending' && (
            <>
              <Button
                title="Tolak"
                variant="outline"
                size="sm"
                onPress={() => handleRejectOrder(order.id)}
                style={{ flex: 1 }}
              />
              <Button
                title="Terima"
                size="sm"
                onPress={() => handleAcceptOrder(order.id)}
                style={{ flex: 1 }}
              />
            </>
          )}
          {(order.status === 'accepted' || order.status === 'on_delivery') && (
            <>
              <Button
                title="Navigasi"
                variant="outline"
                size="sm"
                onPress={() => handleNavigate(order)}
                icon={<Ionicons name="navigate-outline" size={16} color={COLORS.primary} />}
                style={{ flex: 1 }}
              />
              <Button
                title="Selesai"
                size="sm"
                onPress={() => handleCompleteOrder(order.id)}
                style={{ flex: 1 }}
              />
            </>
          )}
          {order.status === 'completed' && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => router.push(`/order/${order.id}`)}
            >
              <Text style={styles.detailButtonText}>Lihat Detail</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pending', label: 'Menunggu' },
    { key: 'active', label: 'Aktif' },
    { key: 'completed', label: 'Selesai' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Tidak ada pesanan</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[200] },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.gray[500] },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  listContent: { padding: 16 },
  orderCard: { marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  orderDate: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  customerName: { fontSize: 14, color: COLORS.gray[700] },
  addressInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12 },
  addressText: { flex: 1, fontSize: 13, color: COLORS.gray[600] },
  orderSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray[100], marginBottom: 12 },
  itemCount: { fontSize: 13, color: COLORS.gray[500] },
  orderTotal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  orderActions: { flexDirection: 'row', gap: 8 },
  detailButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  detailButtonText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 12 },
});
