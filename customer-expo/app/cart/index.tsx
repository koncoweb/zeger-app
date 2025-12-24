import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useCartStore, CartItem } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';

export default function CartScreen() {
  const router = useRouter();
  const { items, selectedOutlet, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();

  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout' as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
            <Text style={styles.clearButtonText}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Outlet Info */}
      {selectedOutlet && (
        <View style={styles.outletInfo}>
          <Ionicons name="storefront" size={20} color={COLORS.primary} />
          <View style={styles.outletText}>
            <Text style={styles.outletName}>{selectedOutlet.name}</Text>
            <Text style={styles.outletAddress} numberOfLines={1}>
              {selectedOutlet.address}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/outlets' as any)}>
            <Text style={styles.changeOutlet}>Ubah</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Items */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
            <Text style={styles.emptyText}>Tambahkan produk untuk melanjutkan</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/menu' as any)}
            >
              <Text style={styles.browseButtonText}>Lihat Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item, index) => (
            <CartItemCard
              key={`${item.id}-${index}`}
              item={item}
              onUpdateQuantity={(qty) => updateQuantity(item.id, item.customizations, qty)}
              onRemove={() => removeItem(item.id, item.customizations)}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const itemPrice = item.price + (item.customizations?.size === 'Large' ? 5000 : 0);

  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemImage}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="cafe" size={24} color={COLORS.gray[400]} />
          </View>
        )}
      </View>

      <View style={styles.cartItemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.customizations && Object.keys(item.customizations).length > 0 && (
          <Text style={styles.itemCustomizations}>
            {Object.entries(item.customizations)
              .filter(([_, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}
          </Text>
        )}
        <Text style={styles.itemPrice}>{formatCurrency(itemPrice)}</Text>
      </View>

      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onUpdateQuantity(item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onUpdateQuantity(item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color={COLORS.gray[700]} />
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  outletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  outletText: {
    flex: 1,
    marginLeft: 12,
  },
  outletName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  outletAddress: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  changeOutlet: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  itemCustomizations: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
