import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { supabase, getImageUrl } from '@/lib/supabase';
import { formatNumber, formatCurrency } from '@/lib/utils';

const { width } = Dimensions.get('window');

interface PromoBanner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
}

interface RecentOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  customer_order_items: Array<{
    product: {
      name: string;
    };
  }>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { customerUser } = useAuthStore();
  
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [voucherCount, setVoucherCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPromoBanners();
    if (customerUser) {
      fetchRecentOrders();
      fetchVoucherCount();
    }
  }, [customerUser]);

  const fetchPromoBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .order('display_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      setPromoBanners(data || []);
    } catch (error) {
      console.error('Error fetching promo banners:', error);
    }
  };

  const fetchRecentOrders = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer_order_items(
            product:products(name)
          )
        `)
        .eq('user_id', customerUser.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const fetchVoucherCount = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_user_vouchers')
        .select('id')
        .eq('user_id', customerUser.id)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;
      setVoucherCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching voucher count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPromoBanners(), 
      fetchRecentOrders(), 
      fetchVoucherCount()
    ]);
    setRefreshing(false);
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleBannerPress = (banner: PromoBanner) => {
    if (banner.link_url) {
      // Handle banner link navigation
      console.log('Navigate to:', banner.link_url);
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'accepted':
        return 'Diterima';
      case 'in_progress':
        return 'Dalam Pengiriman';
      case 'delivered':
        return 'Selesai';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return COLORS.success;
      case 'in_progress':
      case 'accepted':
        return COLORS.primary;
      default:
        return COLORS.warning;
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        {promoBanners.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScrollView}
          >
            {promoBanners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={styles.bannerSlide}
                onPress={() => handleBannerPress(banner)}
              >
                <Image
                  source={{ uri: getImageUrl(banner.image_url) || '' }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {banner.description && (
                    <Text style={styles.bannerDescription}>{banner.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>ZEGER COFFEE</Text>
              <Text style={styles.heroSubtitle}>Coffee On The Wheels</Text>
            </View>
          </>
        )}
      </View>

      {/* Member Card */}
      <View style={styles.memberCard}>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            Hi, {customerUser?.name?.toUpperCase() || 'GUEST'}
          </Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Membership Info */}
        <View style={styles.membershipRow}>
          <TouchableOpacity style={styles.membershipItem} onPress={() => handleNavigate('/(tabs)/promo')}>
            <View style={styles.membershipIcon}>
              <Ionicons name="flame" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Zeger Loyalty</Text>
            <Text style={styles.membershipValue}>{customerUser?.points || 0} Exp</Text>
          </TouchableOpacity>

          <View style={styles.membershipItem}>
            <View style={styles.membershipIcon}>
              <Ionicons name="wallet" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Zeger Point</Text>
            <Text style={styles.membershipValue}>{formatNumber(customerUser?.points || 0)}</Text>
          </View>

          <TouchableOpacity style={styles.membershipItem} onPress={() => handleNavigate('/(tabs)/promo')}>
            <View style={styles.membershipIcon}>
              <Ionicons name="gift" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.membershipLabel}>Voucher</Text>
            <Text style={styles.membershipValue}>{voucherCount} Voucher</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <View style={styles.recentOrdersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pesanan Terakhir</Text>
              <TouchableOpacity onPress={() => handleNavigate('/(tabs)/orders')}>
                <Text style={styles.sectionLink}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentOrdersScroll}>
              {recentOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.recentOrderCard}
                  onPress={() => handleNavigate('/(tabs)/orders')}
                >
                  <View style={styles.recentOrderHeader}>
                    <Text style={styles.recentOrderId}>
                      #{order.id.slice(0, 6).toUpperCase()}
                    </Text>
                    <View style={[
                      styles.recentOrderStatus,
                      { backgroundColor: getOrderStatusColor(order.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.recentOrderStatusText,
                        { color: getOrderStatusColor(order.status) }
                      ]}>
                        {getOrderStatusText(order.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.recentOrderItems} numberOfLines={2}>
                    {order.customer_order_items.map(item => item.product.name).join(', ')}
                  </Text>
                  
                  <Text style={styles.recentOrderPrice}>
                    {formatCurrency(order.total_price)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Order Section Title */}
        <Text style={styles.sectionTitle}>Buat Pesanan Sekarang</Text>

        {/* Order Type Buttons */}
        <View style={styles.orderButtonsRow}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleNavigate('/outlets')}
          >
            <Ionicons name="storefront" size={32} color={COLORS.white} />
            <Text style={styles.orderButtonText}>Zeger Branch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleNavigate('/map')}
          >
            <Ionicons name="bicycle" size={32} color={COLORS.white} />
            <Text style={styles.orderButtonText}>Zeger On The Wheels</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  heroBanner: {
    height: 220,
    position: 'relative',
  },
  bannerScrollView: {
    height: '100%',
  },
  bannerSlide: {
    width: width,
    height: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  memberCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    minHeight: 400,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  membershipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  membershipItem: {
    alignItems: 'center',
    flex: 1,
  },
  membershipIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  membershipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  membershipValue: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  recentOrdersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  sectionLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recentOrdersScroll: {
    marginBottom: 16,
  },
  recentOrderCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  recentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentOrderId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  recentOrderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentOrderStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recentOrderItems: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 8,
    lineHeight: 16,
  },
  recentOrderPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  orderButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});
