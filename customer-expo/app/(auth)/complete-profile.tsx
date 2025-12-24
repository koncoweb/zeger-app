import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { completeProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Silakan isi nama dan nomor telepon');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await completeProfile({ name, phone, address });

      if (error) {
        Alert.alert('Error', error.message || 'Gagal menyimpan profil');
        return;
      }

      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Lengkapi Profil</Text>
          <Text style={styles.headerSubtitle}>Satu langkah lagi untuk menikmati Zeger</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <Text style={styles.label}>Nama Lengkap *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={COLORS.gray[400]}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Input */}
          <Text style={styles.label}>Nomor Telepon *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={COLORS.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="08xxxxxxxxxx"
              placeholderTextColor={COLORS.gray[400]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address Input */}
          <Text style={styles.label}>Alamat (Opsional)</Text>
          <View style={[styles.inputContainer, styles.addressInput]}>
            <Ionicons name="location-outline" size={20} color={COLORS.gray[400]} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 4 }]} />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Masukkan alamat lengkap"
              placeholderTextColor={COLORS.gray[400]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={[styles.completeButton, isLoading && styles.completeButtonDisabled]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.completeButtonText}>Simpan & Lanjutkan</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  addressInput: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
