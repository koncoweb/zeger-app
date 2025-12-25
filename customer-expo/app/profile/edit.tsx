import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { customerUser, setCustomerUser } = useAuthStore();
  
  const [name, setName] = useState(customerUser?.name || '');
  const [phone, setPhone] = useState(customerUser?.phone || '');
  const [address, setAddress] = useState(customerUser?.address || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }
    if (!customerUser?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_users')
        .update({ name: name.trim(), phone: phone.trim(), address: address.trim(), updated_at: new Date().toISOString() })
        .eq('id', customerUser.id)
        .select()
        .single();

      if (error) throw error;
      setCustomerUser(data);
      Alert.alert('Sukses', 'Profil berhasil diperbarui', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'G'}</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Ubah Foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama lengkap" placeholderTextColor={COLORS.gray[400]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={customerUser?.email || ''} editable={false} />
            <Text style={styles.helperText}>Email tidak dapat diubah</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Masukkan nomor telepon" placeholderTextColor={COLORS.gray[400]} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat</Text>
            <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Masukkan alamat lengkap" placeholderTextColor={COLORS.gray[400]} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Simpan Perubahan</Text>}
        </TouchableOpacity>
      </View>
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
  contentContainer: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  changePhotoButton: { paddingHorizontal: 16, paddingVertical: 8 },
  changePhotoText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  form: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.gray[300], borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.gray[900] },
  inputDisabled: { backgroundColor: COLORS.gray[100], color: COLORS.gray[500] },
  textArea: { minHeight: 80 },
  helperText: { fontSize: 12, color: COLORS.gray[500], marginTop: 4 },
  footer: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray[200] },
  saveButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
