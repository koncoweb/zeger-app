import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { supabase, CustomerOrder } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

const { width } = Dimensions.get('window');

interface OrderWithItems extends CustomerOrder {
  customer_order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }>;
}

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { clearCart } = useCartStore();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    fetchOrderDetails();
    clearCart();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer_order_items(
            id,
            quantity,
            price,
            product:products(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);

      // Start animations after data is loaded
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackOrder = () => {
    if (!order) return;
    
    if (order.order_type === 'on_the_wheels') {
      router.push(`/order-tracking/${orderId}` as any);
    } else {
      router.push('/(tabs)/orders' as any);
    }
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)/' as any);
  };

  const handleReorder = () => {
    router.push('/menu' as any);
  };

  const handleExploreMenu = () => {
    router.push('/menu' as any);
  };

  const getEstimatedTime = () => {
    if (!order) return '15-20';
    
    switch (order.order_type) {
      case 'outlet_pickup':
        return '10-15';
      case 'outlet_delivery':
        return '20-30';
      case 'on_the_wheels':
        return '15-25';
      default:
        return '15-20';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat detail pesanan...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Pesanan Tidak Ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={60} color={COLORS.white} />
        </Animated.View>

        {/* Delivery Illustration */}
        <Animated.View style={[styles.illustration, { opacity: fadeAnim }]}>
          <View style={styles.deliveryIcon}>
            {order.order_type === 'on_the_wheels' ? (
              <Ionicons name="bicycle" size={48} color={COLORS.primary} />
            ) : (
              <Ionicons name="storefront" size={48} color={COLORS.primary} />
            )}
          </View>
        </Animated.View>
      </View>

      {/* Success Message */}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.successTitle}>Pesanan Berhasil!</Text>
        <Text style={styles.successSubtitle}>
          Pesanan #{order.id.slice(0, 8).toUpperCase()} telah dibuat
        </Text>
        
        {/* Order Details */}
        <View style={styles.orderDetails}>
          <Text style={styles.orderDetailTitle}>Detail Pesanan:</Text>
          <Text style={styles.orderDetailText}>
            {order.customer_order_items.length} item • {formatCurrency(order.total_price)}
          </Text>
          <Text style={styles.orderDetailText}>
            {order.order_type === 'outlet_pickup' ? 'Ambil di Outlet' : 
             order.order_type === 'outlet_delivery' ? 'Delivery ke Outlet' : 
             'On The Wheels'}
          </Text>
        </View>
        
        {order.order_type === 'on_the_wheels' ? (
          <Text style={styles.estimatedTime}>
            Estimasi pengiriman: {getEstimatedTime()} menit
          </Text>
        ) : (
          <Text style={styles.estimatedTime}>
            Siap diambil dalam: {getEstimatedTime()} menit
          </Text>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleTrackOrder}>
          <Ionicons name="location" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>
            {order.order_type === 'on_the_wheels' ? 'Lacak Pesanan' : 'Lihat Status'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
          <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* What's Next Section */}
      <Animated.View style={[styles.nextActionsContainer, { opacity: fadeAnim }]}>
        <Text style={styles.nextActionsTitle}>Apa Selanjutnya?</Text>
        
        <View style={styles.nextActionsGrid}>
          <TouchableOpacity style={styles.nextActionCard} onPress={handleReorder}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
            <Text style={styles.nextActionText}>Pesan Lagi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextActionCard} onPress={handleExploreMenu}>
            <Ionicons name="restaurant" size={24} color={COLORS.primary} />
            <Text style={styles.nextActionText}>Jelajahi Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextActionCard} onPress={() => router.push('/(tabs)/orders' as any)}>
            <Ionicons name="receipt" size={24} color={COLORS.primary} />
            <Text style={styles.nextActionText}>Riwayat Pesanan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextActionCard} onPress={() => router.push('/(tabs)/promo' as any)}>
            <Ionicons name="gift" size={24} color={COLORS.primary} />
            <Text style={styles.nextActionText}>Lihat Promo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  illustration: {
    alignItems: 'center',
  },
  deliveryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 12,
  },
  orderDetails: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    width: '100%',
  },
  orderDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  nextActionsContainer: {
    flex: 1,
  },
  nextActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 16,
    textAlign: 'center',
  },
  nextActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextActionCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginTop: 8,
    textAlign: 'center',
  },
});