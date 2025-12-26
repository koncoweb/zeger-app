import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomerQuickAdd } from './CustomerQuickAdd';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  branchId?: string;
}

export function CustomerSelector({ selectedCustomer, onSelect, branchId }: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async (query: string = '') => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
        .limit(20);

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers(searchQuery);
    }
  }, [isOpen, searchQuery, fetchCustomers]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  const handleCustomerAdded = (customer: Customer) => {
    setShowQuickAdd(false);
    onSelect(customer);
    setIsOpen(false);
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={[
        styles.customerItem,
        selectedCustomer?.id === item.id && styles.customerItemSelected,
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.customerAvatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name || 'Tanpa Nama'}</Text>
        {item.phone && (
          <Text style={styles.customerPhone}>{item.phone}</Text>
        )}
      </View>
      {selectedCustomer?.id === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setIsOpen(true)}>
        {selectedCustomer ? (
          <View style={styles.selectedContainer}>
            <View style={styles.selectedInfo}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
              <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.gray[400]} />
            <Text style={styles.placeholderText}>Pilih Pelanggan (Opsional)</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pelanggan</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Input
                placeholder="Cari nama atau nomor HP..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Ionicons name="search" size={18} color={COLORS.gray[400]} />}
              />
            </View>

            <FlatList
              data={customers}
              renderItem={renderCustomerItem}
              keyExtractor={(item) => item.id}
              style={styles.customerList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {loading ? 'Memuat...' : 'Tidak ada pelanggan ditemukan'}
                  </Text>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <Button
                title="Tambah Pelanggan Baru"
                variant="outline"
                onPress={() => setShowQuickAdd(true)}
                leftIcon={<Ionicons name="add" size={18} color={COLORS.primary} />}
              />
              <Button
                title="Tanpa Pelanggan"
                variant="ghost"
                onPress={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CustomerQuickAdd
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCustomerAdded={handleCustomerAdded}
        branchId={branchId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: 12,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.gray[400],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  customerList: {
    maxHeight: 300,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  customerItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  modalFooter: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
});
