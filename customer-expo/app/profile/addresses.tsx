import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

interface Address {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
}

export default function AddressesScreen() {
  const router = useRouter();
  const { customerUser } = useAuthStore();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!customerUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', customerUser.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Gagal memuat alamat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!customerUser?.id) return;

    try {
      // First, unset all default addresses
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', customerUser.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      // Refresh the list
      fetchAddresses();
      Alert.alert('Berhasil', 'Alamat utama berhasil diubah');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Gagal mengubah alamat utama');
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Hapus Alamat',
      `Apakah Anda yakin ingin menghapus alamat "${address.label}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('customer_addresses')
                .delete()
                .eq('id', address.id);

              if (error) throw error;

              fetchAddresses();
              Alert.alert('Berhasil', 'Alamat berhasil dihapus');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Gagal menghapus alamat');
            }
          },
        },
      ]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Tersimpan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Belum Ada Alamat</Text>
            <Text style={styles.emptyText}>
              Tambahkan alamat untuk mempermudah proses pemesanan
            </Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressLabelContainer}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Utama</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => {
                      Alert.alert(
                        'Pilih Aksi',
                        '',
                        [
                          { text: 'Batal', style: 'cancel' },
                          {
                            text: 'Jadikan Utama',
                            onPress: () => handleSetDefault(address.id),
                            style: address.is_default ? 'cancel' : 'default',
                          },
                          {
                            text: 'Hapus',
                            style: 'destructive',
                            onPress: () => handleDeleteAddress(address),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray[600]} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.addressText} numberOfLines={3}>
                  {address.address}
                </Text>

                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // Navigate to edit address (to be implemented)
                      console.log('Edit address:', address.id);
                    }}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  {address.latitude && address.longitude && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // Open in maps (to be implemented)
                        console.log('Open in maps:', address.latitude, address.longitude);
                      }}
                    >
                      <Ionicons name="map" size={16} color={COLORS.primary} />
                      <Text style={styles.actionButtonText}>Lihat di Peta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Address Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Navigate to add address (to be implemented)
            console.log('Add new address');
            Alert.alert('Info', 'Fitur tambah alamat akan segera tersedia');
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Tambah Alamat Baru</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
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
    paddingHorizontal: 32,
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  menuButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});