import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const paymentMethods = [
    { id: 'cash', icon: 'cash-outline', name: 'Tunai', description: 'Bayar langsung ke rider/kasir', isActive: true },
    { id: 'qris', icon: 'qr-code-outline', name: 'QRIS', description: 'Scan QR untuk pembayaran', isActive: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metode Pembayaran</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Metode Pembayaran Tersedia</Text>
        
        <View style={styles.methodsList}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodIcon}>
                <Ionicons name={method.icon as any} size={28} color={COLORS.primary} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              {method.isActive && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            Pilih metode pembayaran saat checkout. Pembayaran QRIS akan diverifikasi otomatis setelah scan berhasil.
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
  methodsList: { gap: 12 },
  methodCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  methodIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1, marginLeft: 16 },
  methodName: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  methodDescription: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  activeBadge: { marginLeft: 8 },
  infoCard: { backgroundColor: COLORS.info + '15', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.gray[700], marginLeft: 12, lineHeight: 20 },
});
