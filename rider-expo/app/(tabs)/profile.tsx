import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { COLORS, APP_CONFIG } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { stopTracking } = useLocationStore();

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            stopTracking();
            await signOut();
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      rider: 'Rider',
      bh_rider: 'Branch Hub Rider',
      sb_rider: 'Small Branch Rider',
      '2_Hub_Rider': 'Hub Rider',
      '3_SB_Rider': 'Small Branch Rider',
    };
    return roleMap[role] || role;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.role}>{getRoleLabel(profile?.role || '')}</Text>
        </View>

        {/* Info Cards */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="business-outline" size={20} color={COLORS.gray[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cabang</Text>
              <Text style={styles.infoValue}>{profile?.branch?.name || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={20} color={COLORS.gray[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telepon</Text>
              <Text style={styles.infoValue}>{profile?.phone || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color={COLORS.gray[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alamat Cabang</Text>
              <Text style={styles.infoValue}>{profile?.branch?.address || '-'}</Text>
            </View>
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.gray[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Versi</Text>
              <Text style={styles.infoValue}>{APP_CONFIG.version}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.gray[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.success }]}>Aktif</Text>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Keluar"
          variant="danger"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color={COLORS.white} />}
          style={styles.logoutButton}
        />

        <Text style={styles.copyright}>© 2024 Zeger Coffee. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  role: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.gray[900],
  },
  logoutButton: {
    marginTop: 8,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: 24,
  },
});
