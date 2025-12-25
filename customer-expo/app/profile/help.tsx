import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: 'Bagaimana cara memesan?', answer: 'Pilih menu "Zeger Branch" untuk pesan di outlet atau "Zeger On The Wheels" untuk pesan dari rider terdekat. Pilih produk, tambahkan ke keranjang, lalu checkout.' },
    { question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami menerima pembayaran Tunai dan QRIS. Pilih metode pembayaran saat checkout.' },
    { question: 'Bagaimana cara melacak pesanan?', answer: 'Setelah pesanan dikonfirmasi, Anda dapat melacak lokasi rider secara real-time melalui halaman tracking pesanan.' },
    { question: 'Bagaimana cara menggunakan voucher?', answer: 'Klaim voucher di halaman Promo, lalu pilih voucher saat checkout untuk mendapatkan diskon.' },
    { question: 'Bagaimana cara menukar Zeger Points?', answer: 'Zeger Points dapat ditukar dengan voucher atau diskon di halaman Promo. Setiap pembelian akan menambah poin Anda.' },
  ];

  const contactOptions = [
    { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+62 812-3456-7890', action: () => Linking.openURL('https://wa.me/6281234567890') },
    { icon: 'mail-outline', label: 'Email', value: 'support@zeger.id', action: () => Linking.openURL('mailto:support@zeger.id') },
    { icon: 'call-outline', label: 'Telepon', value: '(031) 123-4567', action: () => Linking.openURL('tel:0311234567') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bantuan</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Pertanyaan Umum (FAQ)</Text>
        
        <View style={styles.faqList}>
          {faqs.map((faq, index) => (
            <TouchableOpacity key={index} style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.gray[500]} />
              </View>
              {expandedFaq === index && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Hubungi Kami</Text>
        
        <View style={styles.contactList}>
          {contactOptions.map((contact, index) => (
            <TouchableOpacity key={index} style={styles.contactItem} onPress={contact.action}>
              <View style={styles.contactIcon}>
                <Ionicons name={contact.icon as any} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            Layanan pelanggan tersedia setiap hari pukul 08:00 - 22:00 WIB. Kami akan merespons pesan Anda secepat mungkin.
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
  contentContainer: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900], marginBottom: 16 },
  faqList: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.gray[900], marginRight: 8 },
  faqAnswer: { fontSize: 13, color: COLORS.gray[600], marginTop: 12, lineHeight: 20 },
  contactList: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  contactIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  contactValue: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  infoCard: { backgroundColor: COLORS.info + '15', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.gray[700], marginLeft: 12, lineHeight: 20 },
});
