import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CustomerQuickAddProps {
  visible: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
  branchId?: string;
}

export function CustomerQuickAdd({ visible, onClose, onCustomerAdded, branchId }: CustomerQuickAddProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama pelanggan wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          branch_id: branchId || null,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Sukses', 'Pelanggan berhasil ditambahkan');
      resetForm();
      onCustomerAdded(data);
    } catch (error: any) {
      console.error('Error adding customer:', error);
      if (error.code === '23505') {
        Alert.alert('Error', 'Nomor HP sudah terdaftar');
      } else {
        Alert.alert('Error', 'Gagal menambahkan pelanggan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Tambah Pelanggan Baru</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input
              label="Nama Pelanggan"
              placeholder="Masukkan nama pelanggan"
              value={name}
              onChangeText={setName}
              leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.gray[400]} />}
            />

            <Input
              label="Nomor HP (Opsional)"
              placeholder="Contoh: 08123456789"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.gray[400]} />}
            />

            <Input
              label="Alamat (Opsional)"
              placeholder="Masukkan alamat"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.gray[400]} />}
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="Batal"
              variant="outline"
              onPress={handleClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Simpan"
              onPress={handleSubmit}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  form: {
    padding: 16,
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
});
