import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { customerUser, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profil', route: '/profile/edit' },
    { icon: 'location-outline', label: 'Alamat Tersimpan', route: '/profile/addresses' },
    { icon: 'card-outline', label: 'Metode Pembayaran', route: '/profile/payment' },
    { icon: 'notifications-outline', label: 'Notifikasi', route: '/profile/notifications' },
    { icon: 'help-circle-outline', label: 'Bantuan', route: '/profile/help' },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', route: '/profile/about' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customerUser?.name?.charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{customerUser?.name || 'Guest'}</Text>
            <Text style={styles.profileEmail}>{customerUser?.email || '-'}</Text>
            <Text style={styles.profilePhone}>{customerUser?.phone || '-'}</Text>
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsInfo}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
            <View style={styles.pointsText}>
              <Text style={styles.pointsLabel}>Zeger Points</Text>
              <Text style={styles.pointsValue}>{customerUser?.points || 0} Points</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.pointsButton}>
            <Text style={styles.pointsButtonText}>Tukar</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.gray[600]} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.signOutText}>Keluar</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Versi 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  pointsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    marginLeft: 12,
  },
  pointsLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  pointsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: COLORS.gray[800],
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray[400],
    marginBottom: 32,
  },
});
