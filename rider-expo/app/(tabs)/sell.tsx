import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useShiftStore } from '@/store/shiftStore';
import { useLocationStore } from '@/store/locationStore';
import { useOffline } from '@/hooks/useOffline';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase, getImageUrl } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { COLORS, PAYMENT_METHODS } from '@/lib/constants';
import { FLATLIST_PERFORMANCE_CONFIG, IMAGE_CACHE_CONFIG } from '@/lib/performance';
import { Inventory, Product } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CustomerSelector } from '@/components/pos/CustomerSelector';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Image } from 'expo-image';

// Memoized product card component
const ProductCard = memo(({ 
  item, 
  cartQty, 
  onPress 
}: { 
  item: Inventory; 
  cartQty: number; 
  onPress: (product: Product) => void;
}) => {
  const product = item.product!;
  const availableStock = item.stock_quantity - cartQty;

  const handlePress = useCallback(() => {
    onPress(product);
  }, [product, onPress]);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={handlePress}
      disabled={availableStock <= 0}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: getImageUrl(product.image_url) || undefined }}
        style={styles.productImage}
        contentFit="cover"
        cachePolicy={IMAGE_CACHE_CONFIG.cachePolicy}
        transition={IMAGE_CACHE_CONFIG.transition}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        <Text style={[styles.stockText, availableStock <= 0 && styles.stockEmpty]}>
          Stok: {availableStock}
        </Text>
      </View>
      {cartQty > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartQty}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

// Memoized cart item component
const CartItemRow = memo(({ 
  item, 
  maxStock, 
  onUpdateQuantity,
  onShowWarning
}: { 
  item: { product: Product; quantity: number }; 
  maxStock: number;
  onUpdateQuantity: (productId: string, quantity: number, maxStock: number) => boolean;
  onShowWarning: () => void;
}) => {
  const handleDecrease = useCallback(() => {
    onUpdateQuantity(item.product.id, item.quantity - 1, maxStock);
  }, [item.product.id, item.quantity, maxStock, onUpdateQuantity]);

  const handleIncrease = useCallback(() => {
    const success = onUpdateQuantity(item.product.id, item.quantity + 1, maxStock);
    if (!success) onShowWarning();
  }, [item.product.id, item.quantity, maxStock, onUpdateQuantity, onShowWarning]);

  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>{formatCurrency(item.product.price * item.quantity)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity style={styles.qtyButton} onPress={handleDecrease}>
          <Ionicons name="remove" size={18} color={COLORS.gray[600]} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyButton} onPress={handleIncrease}>
          <Ionicons name="add" size={18} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

CartItemRow.displayName = 'CartItemRow';

export default function SellScreen() {
  const { profile } = useAuthStore();
  const { isShiftActive } = useShiftStore();
  const { currentLocation } = useLocationStore();
  const { isOnline } = useOffline();
  const toast = useToast();
  const {
    items: cartItems,
    customer,
    addItem,
    removeItem,
    updateQuantity,
    getTotal,
    getTotalItems,
    paymentMethod,
    setPaymentMethod,
    setCustomer,
    checkout,
    clear,
  } = useCartStore();

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .eq('rider_id', profile.id)
        .gt('stock_quantity', 0);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Error', 'Gagal memuat produk');
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

  // Memoize stock lookup map for O(1) access
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach((i) => map.set(i.product_id, i.stock_quantity));
    return map;
  }, [inventory]);

  // Memoize cart quantity lookup map
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((i) => map.set(i.product.id, i.quantity));
    return map;
  }, [cartItems]);

  const getStockForProduct = useCallback((productId: string): number => {
    return stockMap.get(productId) || 0;
  }, [stockMap]);

  const getCartQuantity = useCallback((productId: string): number => {
    return cartQuantityMap.get(productId) || 0;
  }, [cartQuantityMap]);

  const handleAddToCart = useCallback((product: Product) => {
    const maxStock = getStockForProduct(product.id);
    const success = addItem(product, maxStock);
    if (!success) {
      toast.warning('Stok Habis', 'Stok produk tidak mencukupi');
    }
  }, [getStockForProduct, addItem, toast]);

  const handleCheckout = useCallback(async () => {
    if (!profile?.branch_id || !profile?.branch?.code) {
      toast.error('Error', 'Data branch tidak lengkap');
      return;
    }

    if (!isShiftActive) {
      toast.error('Error', 'Mulai shift terlebih dahulu');
      return;
    }

    setCheckoutLoading(true);
    const result = await checkout(
      profile.id,
      profile.branch_id,
      profile.branch.code,
      currentLocation
    );
    setCheckoutLoading(false);

    if (result.error) {
      toast.error('Error', result.error);
    } else {
      setShowPaymentModal(false);
      toast.success('Sukses', 'Transaksi berhasil disimpan');
      fetchInventory();
    }
  }, [profile, isShiftActive, checkout, currentLocation, toast, fetchInventory]);

  const showStockWarning = useCallback(() => {
    toast.warning('Stok Habis', 'Stok tidak mencukupi');
  }, [toast]);

  const openPaymentModal = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  // Memoized render functions
  const renderProduct = useCallback(({ item }: { item: Inventory }) => {
    const cartQty = getCartQuantity(item.product!.id);
    return (
      <ProductCard
        item={item}
        cartQty={cartQty}
        onPress={handleAddToCart}
      />
    );
  }, [getCartQuantity, handleAddToCart]);

  const renderCartItem = useCallback(({ item }: { item: typeof cartItems[0] }) => {
    const maxStock = getStockForProduct(item.product.id);
    return (
      <CartItemRow
        item={item}
        maxStock={maxStock}
        onUpdateQuantity={updateQuantity}
        onShowWarning={showStockWarning}
      />
    );
  }, [getStockForProduct, updateQuantity, showStockWarning]);

  // Memoized key extractors
  const productKeyExtractor = useCallback((item: Inventory) => item.id, []);
  const cartKeyExtractor = useCallback((item: typeof cartItems[0]) => item.product.id, []);

  // Memoized empty component
  const EmptyProductList = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={48} color={COLORS.gray[300]} />
      <Text style={styles.emptyText}>Tidak ada stok tersedia</Text>
    </View>
  ), []);

  if (loading) {
    return <LoadingScreen message="Memuat produk..." />;
  }

  if (!isShiftActive) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>Shift Belum Aktif</Text>
          <Text style={styles.emptyText}>Mulai shift terlebih dahulu untuk melakukan penjualan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineBar}>
            <OfflineIndicator />
          </View>
        )}

        {/* Customer Selector */}
        <View style={styles.customerSection}>
          <CustomerSelector
            selectedCustomer={customer}
            onSelect={setCustomer}
            branchId={profile?.branch_id ?? undefined}
          />
        </View>

        {/* Products Grid - Optimized FlatList */}
        <FlatList
          data={inventory}
          renderItem={renderProduct}
          keyExtractor={productKeyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          ListEmptyComponent={EmptyProductList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          {...FLATLIST_PERFORMANCE_CONFIG}
        />

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <Card style={styles.cartSummary}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Keranjang ({getTotalItems()} item)</Text>
              <TouchableOpacity onPress={clear}>
                <Text style={styles.clearText}>Hapus</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={cartKeyExtractor}
              style={styles.cartList}
              {...FLATLIST_PERFORMANCE_CONFIG}
            />
            <View style={styles.cartFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
              </View>
              <Button
                title="Bayar"
                onPress={openPaymentModal}
                size="lg"
              />
            </View>
          </Card>
        )}
      </View>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pembayaran</Text>
              <TouchableOpacity onPress={closePaymentModal}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentOptions}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method.id && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod(method.id as 'cash' | 'qris' | 'transfer')}
                >
                  <Ionicons
                    name={method.id === 'cash' ? 'cash-outline' : method.id === 'qris' ? 'qr-code-outline' : 'card-outline'}
                    size={24}
                    color={paymentMethod === method.id ? COLORS.primary : COLORS.gray[600]}
                  />
                  <Text style={[
                    styles.paymentLabel,
                    paymentMethod === method.id && styles.paymentLabelActive,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Text style={styles.modalTotal}>{formatCurrency(getTotal())}</Text>
              <Button
                title="Konfirmasi Pembayaran"
                onPress={handleCheckout}
                loading={checkoutLoading}
                size="lg"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  content: { flex: 1 },
  offlineBar: { padding: 8, alignItems: 'center' },
  customerSection: { padding: 8, paddingBottom: 0 },
  productList: { padding: 8 },
  productRow: { gap: 8 },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: 4,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: { width: '100%', height: 100, backgroundColor: COLORS.gray[100] },
  productInfo: { padding: 8 },
  productName: { fontSize: 13, fontWeight: '500', color: COLORS.gray[800], marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  stockText: { fontSize: 11, color: COLORS.gray[500], marginTop: 2 },
  stockEmpty: { color: COLORS.error },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  cartSummary: { maxHeight: 280, margin: 8, padding: 12 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray[800] },
  clearText: { fontSize: 13, color: COLORS.error },
  cartList: { maxHeight: 120 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, color: COLORS.gray[700] },
  cartItemPrice: { fontSize: 12, color: COLORS.gray[500] },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray[100], justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  cartFooter: { borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: 12, marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.gray[700] },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900] },
  paymentOptions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  paymentOption: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray[200] },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  paymentLabel: { fontSize: 13, color: COLORS.gray[600], marginTop: 8 },
  paymentLabelActive: { color: COLORS.primary, fontWeight: '600' },
  modalFooter: { gap: 12 },
  modalTotal: { fontSize: 24, fontWeight: '700', color: COLORS.gray[900], textAlign: 'center' },
});
