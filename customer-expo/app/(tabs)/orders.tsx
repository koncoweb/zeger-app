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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { supabase, CustomerOrder, Product } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface OrderWithItems extends CustomerOrder {
  customer_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    custom_options: any;
    product: {
      name: string;
      image_url?: string;
    };
  }>;
  rider?: {
    id: string;
    full_name: string;
    phone: string;
    photo_url?: string;
  };
}

export default function OrdersScreen() {
  const router = useRouter();
  const { customerUser } = useAuthStore();
  const { clearCart, addMultipleItems, setSelectedOutlet } = useCartStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('customer_orders_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_orders',
          filter: `user_id=eq.${customerUser?.id}`,
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          fetchOrders(); // Refresh orders when updated
          
          // Show notification for important status changes
          const newStatus = payload.new.status;
          if (newStatus === 'accepted') {
            Alert.alert('Pesanan Diterima!', 'Rider sedang menuju lokasi Anda');
          } else if (newStatus === 'delivered') {
            Alert.alert('Pesanan Sampai!', 'Pesanan telah diantar. Selamat menikmati!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerUser]);

  const fetchOrders = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer_order_items(
            *,
            product:products(*)
          ),
          rider:profiles!rider_profile_id(
            id,
            full_name,
            phone,
            photo_url
          )
        `)
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleContactRider = (rider: any) => {
    if (!rider?.phone) {
      Alert.alert('Error', 'Nomor telepon rider tidak tersedia');
      return;
    }

    // Format phone number for WhatsApp
    let phoneNumber = rider.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

  const handleTrackOrder = (order: OrderWithItems) => {
    if (order.order_type === 'on_the_wheels' && order.rider_profile_id) {
      router.push(`/order-tracking/${order.id}` as any);
    } else {
      // For outlet orders, just show order detail
      Alert.alert(
        'Status Pesanan',
        `Pesanan #${order.id.slice(0, 8).toUpperCase()}\nStatus: ${getStatusText(order.status)}`
      );
    }
  };

  const handleReorder = async (order: OrderWithItems) => {
    try {
      // Clear current cart first
      clearCart();
      
      // Prepare items for cart
      const itemsToAdd = order.customer_order_items.map(orderItem => ({
        product: orderItem.product as Product, // Type assertion since we're fetching all product fields
        quantity: orderItem.quantity,
        customizations: (orderItem.custom_options || {}) as {
          size?: string;
          ice?: string;
          sugar?: string;
          notes?: string;
        }
      }));
      
      // Add all items to cart
      addMultipleItems(itemsToAdd);
      
      // Set the same outlet if it was an outlet order
      if (order.order_type === 'outlet_pickup' || order.order_type === 'outlet_delivery') {
        if (order.outlet_id) {
          // We would need to fetch outlet details, for now just show success
          console.log('Outlet order reordered, outlet_id:', order.outlet_id);
        }
      }
      
      Alert.alert(
        'Berhasil',
        `${order.customer_order_items.length} item telah ditambahkan ke keranjang`,
        [
          { text: 'Lanjut Belanja', style: 'cancel' },
          { 
            text: 'Lihat Keranjang', 
            onPress: () => router.push('/cart' as any)
          }
        ]
      );
    } catch (error) {
      console.error('Error reordering:', error);
      Alert.alert('Error', 'Gagal menambahkan pesanan ke keranjang');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'accepted':
      case 'in_progress':
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
        return 'Menunggu Konfirmasi';
      case 'accepted':
        return 'Diterima Rider';
      case 'in_progress':
        return 'Dalam Pengiriman';
      case 'delivered':
        return 'Selesai';
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

  const getActiveOrders = () => {
    return orders.filter(order => 
      ['pending', 'accepted', 'in_progress'].includes(order.status)
    );
  };

  const getHistoryOrders = () => {
    return orders.filter(order => 
      ['delivered', 'completed', 'cancelled', 'rejected'].includes(order.status)
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayOrders = activeTab === 'active' ? getActiveOrders() : getHistoryOrders();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Aktif ({getActiveOrders().length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Riwayat ({getHistoryOrders().length})
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
        {displayOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === 'active' ? 'time-outline' : 'receipt-outline'} 
              size={64} 
              color={COLORS.gray[300]} 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'Tidak Ada Pesanan Aktif' : 'Belum Ada Riwayat'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'Pesanan yang sedang diproses akan muncul di sini'
                : 'Riwayat pesanan akan muncul di sini'
              }
            </Text>
          </View>
        ) : (
          displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTrack={() => handleTrackOrder(order)}
              onContactRider={() => order.rider && handleContactRider(order.rider)}
              onReorder={() => handleReorder(order)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

interface OrderCardProps {
  order: OrderWithItems;
  onTrack: () => void;
  onContactRider: () => void;
  onReorder: () => void;
}

function OrderCard({ order, onTrack, onContactRider, onReorder }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'accepted':
      case 'in_progress':
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
        return 'Menunggu Konfirmasi';
      case 'accepted':
        return 'Diterima Rider';
      case 'in_progress':
        return 'Dalam Pengiriman';
      case 'delivered':
        return 'Selesai';
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

  const isActiveOrder = ['pending', 'accepted', 'in_progress'].includes(order.status);
  const canTrack = order.order_type === 'on_the_wheels' && order.rider_profile_id;
  const canContactRider = order.rider && ['accepted', 'in_progress'].includes(order.status);

  return (
    <View style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <View style={styles.orderTypeContainer}>
            <Ionicons
              name={order.order_type === 'on_the_wheels' ? 'bicycle' : 'storefront'}
              size={12}
              color={COLORS.gray[500]}
            />
            <Text style={styles.orderType}>
              {order.order_type === 'on_the_wheels' ? 'On The Wheels' : 'Outlet'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.orderItems}>
        {order.customer_order_items.slice(0, 2).map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
          </View>
        ))}
        {order.customer_order_items.length > 2 && (
          <Text style={styles.moreItems}>
            +{order.customer_order_items.length - 2} item lainnya
          </Text>
        )}
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <View style={styles.orderInfoRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.gray[500]} />
          <Text style={styles.orderInfoText}>{formatDateTime(order.created_at)}</Text>
        </View>
        {order.delivery_address && (
          <View style={styles.orderInfoRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray[500]} />
            <Text style={styles.orderInfoText} numberOfLines={1}>
              {order.delivery_address}
            </Text>
          </View>
        )}
        <View style={styles.orderInfoRow}>
          <Ionicons name="card-outline" size={14} color={COLORS.gray[500]} />
          <Text style={styles.orderTotal}>{formatCurrency(order.total_price)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.orderActions}>
        {isActiveOrder && canTrack && (
          <TouchableOpacity style={styles.actionButton} onPress={onTrack}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Lacak</Text>
          </TouchableOpacity>
        )}
        
        {canContactRider && (
          <TouchableOpacity style={styles.actionButton} onPress={onContactRider}>
            <Ionicons name="logo-whatsapp" size={16} color={COLORS.success} />
            <Text style={styles.actionButtonText}>Hubungi</Text>
          </TouchableOpacity>
        )}
        
        {!isActiveOrder && (
          <TouchableOpacity style={styles.actionButton} onPress={onReorder}>
            <Ionicons name="refresh" size={16} color={COLORS.gray[600]} />
            <Text style={styles.actionButtonText}>Pesan Lagi</Text>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderType: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.gray[700],
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  moreItems: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  orderInfo: {
    gap: 6,
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
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
});
