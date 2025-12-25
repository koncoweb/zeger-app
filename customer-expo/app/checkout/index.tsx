import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'shipping';
  discount_value: number;
  min_order: number;
}

interface UserVoucher {
  id: string;
  voucher_id: string;
  is_used: boolean;
  voucher: Voucher;
}

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
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<UserVoucher[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === 'outlet_delivery' ? 10000 : 0;
  const maxPointsCanUse = Math.min(customerUser?.points || 0, Math.floor(subtotal / 100));

  const calculateVoucherDiscount = (voucher: Voucher, orderTotal: number): number => {
    if (orderTotal < voucher.min_order) return 0;
    switch (voucher.discount_type) {
      case 'percentage': return Math.floor(orderTotal * (voucher.discount_value / 100));
      case 'fixed': return Math.min(voucher.discount_value, orderTotal);
      case 'shipping': return deliveryFee;
      default: return 0;
    }
  };

  const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher.voucher, subtotal) : 0;
  const pointsDiscount = usePoints ? pointsToUse * 100 : 0;
  const total = Math.max(0, subtotal + deliveryFee - voucherDiscount - pointsDiscount);

  useEffect(() => { if (customerUser) fetchAvailableVouchers(); }, [customerUser]);
  useEffect(() => { if (usePoints && pointsToUse === 0) setPointsToUse(Math.min(maxPointsCanUse, Math.floor(subtotal / 100))); }, [usePoints, maxPointsCanUse, subtotal]);

  const fetchAvailableVouchers = async () => {
    if (!customerUser?.id) return;
    try {
      const { data, error } = await supabase.from('customer_user_vouchers').select('*, voucher:customer_vouchers(*)').eq('user_id', customerUser.id).eq('is_used', false);
      if (error) throw error;
      setAvailableVouchers(data || []);
    } catch (error) { console.error('Error fetching vouchers:', error); }
  };

  const handleVoucherSelect = (voucher: UserVoucher | null) => { setSelectedVoucher(voucher); setShowVoucherModal(false); };

  const handlePlaceOrder = async () => {
    if (!customerUser || !selectedOutlet) { Alert.alert('Error', 'Data tidak lengkap'); return; }
    if (orderType === 'outlet_delivery' && !deliveryAddress) { Alert.alert('Error', 'Silakan isi alamat pengiriman'); return; }
    setIsLoading(true);
    try {
      const { data: order, error: orderError } = await supabase.from('customer_orders').insert({
        user_id: customerUser.id, outlet_id: selectedOutlet.id, order_type: orderType,
        delivery_address: orderType === 'outlet_delivery' ? deliveryAddress : null,
        latitude: location?.latitude || null, longitude: location?.longitude || null,
        payment_method: paymentMethod, total_price: total, delivery_fee: deliveryFee,
        discount_amount: voucherDiscount + pointsDiscount, voucher_id: selectedVoucher?.voucher_id || null, status: 'pending',
      }).select().single();
      if (orderError) throw orderError;
      const orderItems = items.map((item) => ({ order_id: order.id, product_id: item.id, quantity: item.quantity, price: item.price, custom_options: item.customizations }));
      const { error: itemsError } = await supabase.from('customer_order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      if (selectedVoucher) await supabase.from('customer_user_vouchers').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', selectedVoucher.id);
      if (usePoints && pointsToUse > 0) {
        const newPoints = (customerUser.points || 0) - pointsToUse;
        await supabase.from('customer_users').update({ points: newPoints }).eq('id', customerUser.id);
        await supabase.from('customer_points_history').insert({ user_id: customerUser.id, change: -pointsToUse, description: 'Digunakan untuk pesanan #' + order.id.slice(0, 8), order_id: order.id });
      }
      clearCart();
      router.replace({ pathname: '/order-success', params: { orderId: order.id } } as any);
    } catch (error: any) { console.error('Error creating order:', error); Alert.alert('Error', error.message || 'Gagal membuat pesanan'); }
    finally { setIsLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={COLORS.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipe Pesanan</Text>
          <View style={styles.orderTypeRow}>
            <TouchableOpacity style={[styles.orderTypeButton, orderType === 'outlet_pickup' && styles.orderTypeButtonSelected]} onPress={() => setOrderType('outlet_pickup')}>
              <Ionicons name="storefront" size={24} color={orderType === 'outlet_pickup' ? COLORS.primary : COLORS.gray[500]} />
              <Text style={[styles.orderTypeText, orderType === 'outlet_pickup' && styles.orderTypeTextSelected]}>Ambil di Outlet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.orderTypeButton, orderType === 'outlet_delivery' && styles.orderTypeButtonSelected]} onPress={() => setOrderType('outlet_delivery')}>
              <Ionicons name="bicycle" size={24} color={orderType === 'outlet_delivery' ? COLORS.primary : COLORS.gray[500]} />
              <Text style={[styles.orderTypeText, orderType === 'outlet_delivery' && styles.orderTypeTextSelected]}>Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>
        {orderType === 'outlet_delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
            <TextInput style={styles.addressInput} placeholder="Masukkan alamat lengkap" placeholderTextColor={COLORS.gray[400]} value={deliveryAddress} onChangeText={setDeliveryAddress} multiline numberOfLines={3} />
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voucher</Text>
          <TouchableOpacity style={styles.voucherSelector} onPress={() => setShowVoucherModal(true)}>
            <View style={styles.voucherSelectorContent}>
              <Ionicons name="pricetag" size={20} color={COLORS.primary} />
              <Text style={styles.voucherSelectorText}>{selectedVoucher ? selectedVoucher.voucher.code : 'Pilih Voucher'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
          {selectedVoucher && <Text style={styles.voucherDiscountText}>-{formatCurrency(voucherDiscount)}</Text>}
        </View>
        {(customerUser?.points || 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.pointsHeader}><Text style={styles.sectionTitle}>Gunakan Poin</Text><Text style={styles.pointsBalance}>{customerUser?.points || 0} poin tersedia</Text></View>
            <TouchableOpacity style={styles.pointsToggleButton} onPress={() => setUsePoints(!usePoints)}>
              <Ionicons name={usePoints ? 'checkbox' : 'square-outline'} size={24} color={usePoints ? COLORS.primary : COLORS.gray[400]} />
              <Text style={styles.pointsToggleText}>{usePoints ? 'Menggunakan ' + pointsToUse + ' poin (-' + formatCurrency(pointsDiscount) + ')' : 'Gunakan poin saya'}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]} onPress={() => setPaymentMethod('cash')}>
            <Ionicons name="cash" size={24} color={paymentMethod === 'cash' ? COLORS.primary : COLORS.gray[500]} />
            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextSelected]}>Tunai</Text>
            {paymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'qris' && styles.paymentOptionSelected]} onPress={() => setPaymentMethod('qris')}>
            <Ionicons name="qr-code" size={24} color={paymentMethod === 'qris' ? COLORS.primary : COLORS.gray[500]} />
            <Text style={[styles.paymentText, paymentMethod === 'qris' && styles.paymentTextSelected]}>QRIS</Text>
            {paymentMethod === 'qris' && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan</Text>
          <TextInput style={styles.notesInput} placeholder="Tambahkan catatan (opsional)" placeholderTextColor={COLORS.gray[400]} value={notes} onChangeText={setNotes} multiline />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({items.length} item)</Text><Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text></View>
            {orderType === 'outlet_delivery' && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Ongkos Kirim</Text><Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text></View>}
            {voucherDiscount > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabelDiscount}>Diskon Voucher</Text><Text style={styles.summaryValueDiscount}>-{formatCurrency(voucherDiscount)}</Text></View>}
            {pointsDiscount > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabelDiscount}>Diskon Poin</Text><Text style={styles.summaryValueDiscount}>-{formatCurrency(pointsDiscount)}</Text></View>}
            <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatCurrency(total)}</Text></View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]} onPress={handlePlaceOrder} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={COLORS.white} /> : <><Text style={styles.placeOrderButtonText}>Buat Pesanan</Text><Text style={styles.placeOrderPrice}>{formatCurrency(total)}</Text></>}
        </TouchableOpacity>
      </View>
      <Modal visible={showVoucherModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Pilih Voucher</Text><TouchableOpacity onPress={() => setShowVoucherModal(false)}><Ionicons name="close" size={24} color={COLORS.gray[600]} /></TouchableOpacity></View>
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity style={[styles.voucherOption, !selectedVoucher && styles.voucherOptionSelected]} onPress={() => handleVoucherSelect(null)}><Text style={styles.voucherOptionText}>Tidak menggunakan voucher</Text></TouchableOpacity>
              {availableVouchers.map((uv) => {
                const isEligible = subtotal >= uv.voucher.min_order;
                return (
                  <TouchableOpacity key={uv.id} style={[styles.voucherOption, selectedVoucher?.id === uv.id && styles.voucherOptionSelected, !isEligible && styles.voucherOptionDisabled]} onPress={() => isEligible && handleVoucherSelect(uv)} disabled={!isEligible}>
                    <View style={styles.voucherOptionContent}>
                      <Text style={[styles.voucherOptionCode, !isEligible && styles.voucherOptionTextDisabled]}>{uv.voucher.code}</Text>
                      <Text style={[styles.voucherOptionDesc, !isEligible && styles.voucherOptionTextDisabled]}>{uv.voucher.description}</Text>
                      {!isEligible && <Text style={styles.voucherMinOrder}>Min. pembelian {formatCurrency(uv.voucher.min_order)}</Text>}
                    </View>
                    {selectedVoucher?.id === uv.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[100] },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: COLORS.primary },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' },
  headerPlaceholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  section: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 12 },
  orderTypeRow: { flexDirection: 'row', gap: 12 },
  orderTypeButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray[200], alignItems: 'center', gap: 8 },
  orderTypeButtonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  orderTypeText: { fontSize: 14, fontWeight: '500', color: COLORS.gray[600] },
  orderTypeTextSelected: { color: COLORS.primary },
  addressInput: { borderWidth: 1, borderColor: COLORS.gray[300], borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.gray[900], minHeight: 80, textAlignVertical: 'top' },
  voucherSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: COLORS.gray[300], borderRadius: 8 },
  voucherSelectorContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voucherSelectorText: { fontSize: 14, color: COLORS.gray[700] },
  voucherDiscountText: { fontSize: 14, color: COLORS.success, fontWeight: '600', marginTop: 8 },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pointsBalance: { fontSize: 12, color: COLORS.gray[500] },
  pointsToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointsToggleText: { fontSize: 14, color: COLORS.gray[700] },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: COLORS.gray[200], borderRadius: 8, marginBottom: 8, gap: 12 },
  paymentOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  paymentText: { flex: 1, fontSize: 14, color: COLORS.gray[700] },
  paymentTextSelected: { color: COLORS.primary, fontWeight: '600' },
  notesInput: { borderWidth: 1, borderColor: COLORS.gray[300], borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.gray[900], minHeight: 60, textAlignVertical: 'top' },
  summaryCard: { backgroundColor: COLORS.gray[50], borderRadius: 8, padding: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: COLORS.gray[600] },
  summaryValue: { fontSize: 14, color: COLORS.gray[900] },
  summaryLabelDiscount: { fontSize: 14, color: COLORS.success },
  summaryValueDiscount: { fontSize: 14, color: COLORS.success },
  summaryTotal: { borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[900] },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  footer: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray[200] },
  placeOrderButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  placeOrderButtonDisabled: { opacity: 0.7 },
  placeOrderButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  placeOrderPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[200] },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[900] },
  modalContent: { padding: 16 },
  voucherOption: { padding: 16, borderWidth: 1, borderColor: COLORS.gray[200], borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voucherOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  voucherOptionDisabled: { opacity: 0.5 },
  voucherOptionContent: { flex: 1 },
  voucherOptionText: { fontSize: 14, color: COLORS.gray[700] },
  voucherOptionCode: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  voucherOptionDesc: { fontSize: 12, color: COLORS.gray[600], marginTop: 4 },
  voucherOptionTextDisabled: { color: COLORS.gray[400] },
  voucherMinOrder: { fontSize: 11, color: COLORS.error, marginTop: 4 },
});
