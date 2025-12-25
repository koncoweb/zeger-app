import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { supabase, Product } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';

interface CustomizationOption {
  id: string;
  name: string;
  options: string[];
  required?: boolean;
  priceModifier?: { [key: string]: number };
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<{ [key: string]: any }>({});
  const [totalPrice, setTotalPrice] = useState(0);

  // Default customization options
  const customizationOptions: CustomizationOption[] = [
    {
      id: 'size',
      name: 'Ukuran',
      options: ['Regular', 'Large'],
      required: true,
      priceModifier: { 'Large': 5000 },
    },
    {
      id: 'temperature',
      name: 'Suhu',
      options: ['Hot', 'Ice', 'Warm'],
      required: true,
    },
    {
      id: 'sweetness',
      name: 'Tingkat Manis',
      options: ['Normal', 'Less Sweet', 'Extra Sweet'],
      required: false,
    },
    {
      id: 'toppings',
      name: 'Topping',
      options: ['Whipped Cream', 'Extra Shot', 'Vanilla Syrup', 'Caramel Syrup'],
      required: false,
      priceModifier: {
        'Whipped Cream': 3000,
        'Extra Shot': 5000,
        'Vanilla Syrup': 2000,
        'Caramel Syrup': 2000,
      },
    },
  ];

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    calculateTotalPrice();
  }, [product, quantity, customizations]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);

      // Set default customizations
      const defaultCustomizations: { [key: string]: any } = {};
      customizationOptions.forEach((option) => {
        if (option.required && option.options.length > 0) {
          defaultCustomizations[option.id] = option.options[0];
        }
      });
      setCustomizations(defaultCustomizations);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Gagal memuat detail produk');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return;

    let price = product.price;

    // Add price modifiers from customizations
    customizationOptions.forEach((option) => {
      if (option.priceModifier && customizations[option.id]) {
        const selectedValue = customizations[option.id];
        if (Array.isArray(selectedValue)) {
          // Multiple selections (like toppings)
          selectedValue.forEach((value) => {
            price += option.priceModifier![value] || 0;
          });
        } else {
          // Single selection
          price += option.priceModifier[selectedValue] || 0;
        }
      }
    });

    setTotalPrice(price * quantity);
  };

  const handleCustomizationChange = (optionId: string, value: any, isMultiple = false) => {
    setCustomizations((prev) => {
      if (isMultiple) {
        const currentValues = prev[optionId] || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v: any) => v !== value)
          : [...currentValues, value];
        return { ...prev, [optionId]: newValues };
      } else {
        return { ...prev, [optionId]: value };
      }
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate required customizations
    const missingRequired = customizationOptions
      .filter((option) => option.required && !customizations[option.id])
      .map((option) => option.name);

    if (missingRequired.length > 0) {
      Alert.alert('Pilihan Wajib', `Silakan pilih: ${missingRequired.join(', ')}`);
      return;
    }

    addItem(product, quantity, customizations);
    Alert.alert(
      'Berhasil!',
      `${product.name} telah ditambahkan ke keranjang`,
      [
        { text: 'Lanjut Belanja', style: 'cancel' },
        { text: 'Lihat Keranjang', onPress: () => router.push('/cart' as any) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Produk tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cafe" size={64} color={COLORS.gray[400]} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
          {product.description && (
            <Text style={styles.productDescription}>{product.description}</Text>
          )}
        </View>

        {/* Customization Options */}
        <View style={styles.customizationContainer}>
          <Text style={styles.customizationTitle}>Kustomisasi</Text>

          {customizationOptions.map((option) => (
            <View key={option.id} style={styles.customizationOption}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionName}>{option.name}</Text>
                {option.required && <Text style={styles.requiredLabel}>*</Text>}
              </View>

              <View style={styles.optionValues}>
                {option.options.map((value) => {
                  const isMultiple = option.id === 'toppings';
                  const isSelected = isMultiple
                    ? (customizations[option.id] || []).includes(value)
                    : customizations[option.id] === value;
                  const priceModifier = option.priceModifier?.[value];

                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.optionValue, isSelected && styles.optionValueSelected]}
                      onPress={() => handleCustomizationChange(option.id, value, isMultiple)}
                    >
                      <View style={styles.optionValueContent}>
                        <Text
                          style={[
                            styles.optionValueText,
                            isSelected && styles.optionValueTextSelected,
                          ]}
                        >
                          {value}
                        </Text>
                        {priceModifier && (
                          <Text
                            style={[
                              styles.optionValuePrice,
                              isSelected && styles.optionValuePriceSelected,
                            ]}
                          >
                            +{formatCurrency(priceModifier)}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Quantity Selector */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Jumlah</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.gray[700]} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={COLORS.gray[700]} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart" size={20} color={COLORS.white} />
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.gray[700],
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
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
  imageContainer: {
    height: 250,
    backgroundColor: COLORS.white,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  productInfo: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  customizationContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 12,
  },
  customizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  customizationOption: {
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  requiredLabel: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 4,
  },
  optionValues: {
    gap: 8,
  },
  optionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  optionValueSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionValueContent: {
    flex: 1,
  },
  optionValueText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  optionValueTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionValuePrice: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  optionValuePriceSelected: {
    color: COLORS.primary,
  },
  quantityContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    minWidth: 40,
    textAlign: 'center',
  },
  bottomAction: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  addToCartButton: {
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
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});