import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function AboutScreen() {
  const router = useRouter();

  const socialLinks = [
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/zegercoffee' },
    { icon: 'logo-facebook', label: 'Facebook', url: 'https://facebook.com/zegercoffee' },
    { icon: 'logo-twitter', label: 'Twitter', url: 'https://twitter.com/zegercoffee' },
  ];

  const legalLinks = [
    { label: 'Syarat & Ketentuan', url: 'https://zeger.id/terms' },
    { label: 'Kebijakan Privasi', url: 'https://zeger.id/privacy' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ZEGER</Text>
            <Text style={styles.logoSubtext}>COFFEE</Text>
          </View>
          <Text style={styles.tagline}>Coffee On The Wheels</Text>
          <Text style={styles.version}>Versi 1.0.0</Text>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Tentang Zeger Coffee</Text>
          <Text style={styles.descriptionText}>
            Zeger Coffee adalah platform pemesanan kopi inovatif yang menghadirkan pengalaman "Coffee On The Wheels". 
            Nikmati kopi berkualitas dari rider kami yang siap mengantar langsung ke lokasi Anda, atau kunjungi outlet terdekat untuk pengalaman yang lebih personal.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Fitur Unggulan</Text>
          <View style={styles.featureItem}>
            <Ionicons name="bicycle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Pesan dari rider terdekat (On The Wheels)</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="storefront" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Pesan dari outlet favorit Anda</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Lacak pesanan secara real-time</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="gift" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Program loyalti & voucher eksklusif</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ikuti Kami</Text>
        <View style={styles.socialList}>
          {socialLinks.map((social, index) => (
            <TouchableOpacity key={index} style={styles.socialItem} onPress={() => Linking.openURL(social.url)}>
              <Ionicons name={social.icon as any} size={24} color={COLORS.gray[700]} />
              <Text style={styles.socialLabel}>{social.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legalSection}>
          {legalLinks.map((link, index) => (
            <TouchableOpacity key={index} style={styles.legalItem} onPress={() => Linking.openURL(link.url)}>
              <Text style={styles.legalText}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.copyright}>© 2025 Zeger Coffee. All rights reserved.</Text>
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
  contentContainer: { padding: 16, paddingBottom: 32 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { width: 100, height: 100, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  logoSubtext: { fontSize: 10, fontWeight: '600', color: COLORS.white, letterSpacing: 2 },
  tagline: { fontSize: 16, color: COLORS.gray[600], marginBottom: 4 },
  version: { fontSize: 13, color: COLORS.gray[400] },
  descriptionCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16 },
  descriptionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 8 },
  descriptionText: { fontSize: 14, color: COLORS.gray[600], lineHeight: 22 },
  featuresCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 24 },
  featuresTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 14, color: COLORS.gray[700], marginLeft: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 12 },
  socialList: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 24 },
  socialItem: { alignItems: 'center' },
  socialLabel: { fontSize: 12, color: COLORS.gray[600], marginTop: 4 },
  legalSection: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  legalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  legalText: { fontSize: 14, color: COLORS.gray[700] },
  copyright: { textAlign: 'center', fontSize: 12, color: COLORS.gray[400] },
});
