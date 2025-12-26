import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency, formatDateTime, openGoogleMaps } from '@/lib/utils';
import { COLORS, ORDER_STATUS } from '@/lib/constants';
import { CustomerOrder } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const toast = useToast();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('customer_orders')
          .select(`
            *,
            items:customer_order_items(*, product:products(*)),
            customer_user:customer_users(id, name, phone, address)
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Error', 'Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingScreen message="Memuat detail pesanan..." />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Pesanan tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;

  const handleNavigate = () => {
    if (order.latitude && order.longitude) {
      openGoogleMaps(order.latitude, order.longitude);
    } else {
      toast.error('Error', 'Lokasi tidak tersedia');
    }
  };

  const handleCallCustomer = () => {
    if (order.customer_user?.phone) {
      // Use Linking to make a call
      const phoneUrl = `tel:${order.customer_user.phone}`;
      Linking.openURL(phoneUrl);
    } else {
      toast.error('Error', 'Nomor telepon tidak tersedia');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Header */}
        <Card style={styles.headerCard}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDateTime(order.created_at)}</Text>
          <Text style={styles.orderType}>
            {order.order_type === 'on_the_wheels' ? 'Zeger On The Wheels' : 
             order.order_type === 'outlet_delivery' ? 'Delivery dari Outlet' : 'Pickup di Outlet'}
          </Text>
        </Card>

        {/* Customer Info */}
        <Card style={styles.customerCard}>
          <Text style={styles.sectionTitle}>Informasi Customer</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.gray[500]} />
            <Text style={styles.infoText}>{order.customer_user?.name || 'Customer'}</Text>
          </View>

          {order.customer_user?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.gray[500]} />
              <Text style={styles.infoText}>{order.customer_user.phone}</Text>
            </View>
          )}

          {order.delivery_address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.gray[500]} />
              <Text style={styles.infoText}>{order.delivery_address}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {order.customer_user?.phone && (
              <Button
                title="Hubungi"
                variant="outline"
                size="sm"
                onPress={handleCallCustomer}
                icon={<Ionicons name="call-outline" size={16} color={COLORS.primary} />}
                style={{ flex: 1 }}
              />
            )}
            {order.latitude && order.longitude && (
              <Button
                title="Navigasi"
                size="sm"
                onPress={handleNavigate}
                icon={<Ionicons name="navigate-outline" size={16} color={COLORS.white} />}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </Card>

        {/* Order Items */}
        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Item Pesanan</Text>
          
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product?.name}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(order.total_price - (order.delivery_fee || 0) + (order.discount_amount || 0))}
            </Text>
          </View>

          {order.delivery_fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.delivery_fee)}</Text>
            </View>
          )}

          {order.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                -{formatCurrency(order.discount_amount)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total_price)}</Text>
          </View>
        </Card>

        {/* Payment Info */}
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          <View style={styles.paymentRow}>
            <Ionicons
              name={order.payment_method === 'cash' ? 'cash-outline' : 
                    order.payment_method === 'qris' ? 'qr-code-outline' : 'card-outline'}
              size={20}
              color={COLORS.gray[600]}
            />
            <Text style={styles.paymentMethod}>
              {order.payment_method === 'cash' ? 'Tunai' :
               order.payment_method === 'qris' ? 'QRIS' : 'Transfer'}
            </Text>
          </View>
        </Card>

        {/* Rejection Reason */}
        {order.status === 'rejected' && order.rejection_reason && (
          <Card style={styles.rejectionCard}>
            <Text style={styles.sectionTitle}>Alasan Penolakan</Text>
            <Text style={styles.rejectionText}>{order.rejection_reason}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  content: { padding: 16 },
  headerCard: { marginBottom: 12 },
  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDate: { fontSize: 14, color: COLORS.gray[500], marginTop: 4 },
  orderType: { fontSize: 13, color: COLORS.primary, marginTop: 4 },
  customerCard: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 14, color: COLORS.gray[800] },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  itemsCard: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: COLORS.gray[800] },
  itemQty: { fontSize: 13, color: COLORS.gray[500] },
  itemPrice: { fontSize: 14, fontWeight: '500', color: COLORS.gray[900] },
  divider: { height: 1, backgroundColor: COLORS.gray[200], marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 14, color: COLORS.gray[500] },
  summaryValue: { fontSize: 14, color: COLORS.gray[700] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.gray[200] },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.gray[700] },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  paymentCard: { marginBottom: 12 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentMethod: { fontSize: 14, color: COLORS.gray[800] },
  rejectionCard: { marginBottom: 12, backgroundColor: `${COLORS.error}10`, borderWidth: 1, borderColor: COLORS.error },
  rejectionText: { fontSize: 14, color: COLORS.error },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 12 },
});
