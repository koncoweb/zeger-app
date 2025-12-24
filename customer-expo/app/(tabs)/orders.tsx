import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { supabase, CustomerOrder } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function OrdersScreen() {
  const { customerUser } = useAuthStore();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('user_id', customerUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customerUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'pending':
      case 'pending_payment':
        return COLORS.warning;
      case 'accepted':
      case 'on_the_way':
        return COLORS.info;
      case 'cancelled':
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'pending_payment':
        return 'Menunggu Pembayaran';
      case 'accepted':
        return 'Diterima';
      case 'on_the_way':
        return 'Dalam Perjalanan';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
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
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptyText}>
              Pesanan Anda akan muncul di sini
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderInfo}>
                <View style={styles.orderInfoRow}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.orderInfoText}>{formatDateTime(order.created_at)}</Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.orderInfoText} numberOfLines={1}>
                    {order.delivery_address || 'Pickup'}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{formatCurrency(order.total_price)}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderInfoText: {
    fontSize: 13,
    color: COLORS.gray[600],
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
