import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ORDER_TYPES, PAYMENT_METHODS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, selectedOutlet, getTotalPrice, clearCart } = useCartStore();
  const { customerUser } = useAuthStore();
  const { location } = useLocation();

  const [orderType, setOrderType] = useState<'outlet_pickup' | 'outlet_delivery'>('outlet_pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [deliveryAddress, setDeliveryAddress] = useState(customerUser?.address || '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === 'outlet_delivery' ? 10000 : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!customerUser || !selectedOutlet) {
      Alert.alert('Error', 'Data tidak lengkap');
      return;
    }

    if (orderType === 'outlet_delivery' && !deliveryAddress) {
      Alert.alert('Error', 'Silakan isi alamat pengiriman');
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('customer_orders')
        .insert({
          user_id: customerUser.id,
          outlet_id: selectedOutlet.id,
          order_type: orderType,
          delivery_address: orderType === 'outlet_delivery' ? deliveryAddress : null,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          payment_method: paymentMethod,
          total_price: total,
          delivery_fee: deliveryFee,
          discount_amount: 0,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        custom_options: item.customizations,
      }));

      const { error: itemsError } = await supabase
        .from('customer_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and navigate to success
      clearCart();

      Alert.alert(
        'Pesanan Berhasil!',
        `Pesanan #${order.id.slice(0, 8).toUpperCase()} telah dibuat`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/orders' as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.message || 'Gagal membuat pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipe Pesanan</Text>
          <View style={styles.orderTypeRow}>
            <TouchableOpacity
              style={[styles.orderTypeButton, orderType === 'outlet_pickup' && styles.orderTypeButtonSelected]}
              onPress={() => setOrderType('outlet_pickup')}
            >
              <Ionicons
                name="storefront"
                size={24}
                color={orderType === 'outlet_pickup' ? COLORS.primary : COLORS.gray[500]}
              />
              <Text
                style={[styles.orderTypeText, orderType === 'outlet_pickup' && styles.orderTypeTextSelected]}
              >
                Ambil di Outlet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.orderTypeButton, orderType === 'outlet_delivery' && styles.orderTypeButtonSelected]}
              onPress={() => setOrderType('outlet_delivery')}
            >
              <Ionicons
                name="bicycle"
                size={24}
                color={orderType === 'outlet_delivery' ? COLORS.primary : COLORS.gray[500]}
              />
              <Text
                style={[styles.orderTypeText, orderType === 'outlet_delivery' && styles.orderTypeTextSelected]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        {orderType === 'outlet_delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Masukkan alamat lengkap"
              placeholderTextColor={COLORS.gray[400]}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Ionicons name="cash" size={24} color={paymentMethod === 'cash' ? COLORS.primary : COLORS.gray[500]} />
            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextSelected]}>
              Tunai
            </Text>
            {paymentMethod === 'cash' && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'qris' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('qris')}
          >
            <Ionicons name="qr-code" size={24} color={paymentMethod === 'qris' ? COLORS.primary : COLORS.gray[500]} />
            <Text style={[styles.paymentText, paymentMethod === 'qris' && styles.paymentTextSelected]}>
              QRIS
            </Text>
            {paymentMethod === 'qris' && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Tambahkan catatan untuk pesanan"
            placeholderTextColor={COLORS.gray[400]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({items.length} item)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {orderType === 'outlet_delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
                <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>Buat Pesanan</Text>
              <Text style={styles.placeOrderPrice}>{formatCurrency(total)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  orderTypeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
    marginTop: 8,
  },
  orderTypeTextSelected: {
    color: COLORS.primary,
  },
  addressInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
    marginLeft: 12,
  },
  paymentTextSelected: {
    color: COLORS.primary,
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.gray[900],
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.gray[900],
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
    justifyContent: 'center',
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeOrderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
