import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    riderLocation: true,
    newProducts: false,
    newsletter: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationItems = [
    { key: 'orderUpdates' as const, icon: 'receipt-outline', title: 'Update Pesanan', description: 'Notifikasi status pesanan Anda' },
    { key: 'promotions' as const, icon: 'pricetag-outline', title: 'Promo & Diskon', description: 'Info promo dan penawaran spesial' },
    { key: 'riderLocation' as const, icon: 'location-outline', title: 'Lokasi Rider', description: 'Update lokasi rider saat pengiriman' },
    { key: 'newProducts' as const, icon: 'cafe-outline', title: 'Produk Baru', description: 'Info menu dan produk terbaru' },
    { key: 'newsletter' as const, icon: 'mail-outline', title: 'Newsletter', description: 'Berita dan update dari Zeger' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Pengaturan Notifikasi</Text>
        
        <View style={styles.settingsList}>
          {notificationItems.map((item) => (
            <View key={item.key} style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.gray[600]} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggleSetting(item.key)}
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary + '50' }}
                thumbColor={settings[item.key] ? COLORS.primary : COLORS.gray[100]}
              />
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            Anda dapat mengubah pengaturan notifikasi kapan saja. Notifikasi penting seperti update pesanan tetap akan dikirim.
          </Text>
        </View>
      </ScrollView>
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
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 16 },
  settingsList: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.gray[100], justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray[900] },
  settingDescription: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  infoCard: { backgroundColor: COLORS.info + '15', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.gray[700], marginLeft: 12, lineHeight: 20 },
});
