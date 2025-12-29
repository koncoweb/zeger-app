import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Appbar, Card, Text, FAB, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import { auth, db } from '../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, WeighingSession, FarmSettings, UserData } from '../types';
import { signOut } from 'firebase/auth';
import { printReceipt, shareReceipt } from '../services/printerService';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [sessions, setSessions] = useState<WeighingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [showActivities, setShowActivities] = useState(true); // Toggle for activities section

  useEffect(() => {
    // Check authentication
    if (!auth.currentUser) {
      navigation.replace('Login');
      return;
    }

    // Fetch User Role
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUserRole(userData.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };
    fetchUserRole();

    // Fetch Settings
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as FarmSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();

    // Subscribe to Weighing Sessions
    const q = query(collection(db, 'weighing_sessions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: WeighingSession[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeighingSession));
      setSessions(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const renderSessionItem = ({ item }: { item: WeighingSession }) => (
    <Card style={styles.compactCard}>
      <Card.Content style={styles.compactCardContent}>
        <View style={styles.compactCardHeader}>
          <View style={styles.compactCardLeft}>
            <Text style={styles.compactCardTitle}>{item.buyer}</Text>
            <Text style={styles.compactCardSubtitle}>
              {(item.totalNetWeight || 0).toFixed(2).replace('.', ',')} Kg • {item.totalColi || 0} Timbangan
            </Text>
          </View>
          <View style={styles.compactCardRight}>
            <Text style={styles.compactCardDate}>{new Date(item.date).toLocaleDateString('id-ID')}</Text>
            <Text style={styles.compactCardPrice}>{formatCurrency(item.totalAmount || 0)}</Text>
          </View>
        </View>
      </Card.Content>
      <View style={styles.compactCardActions}>
        <IconButton 
          icon="printer" 
          size={18} 
          onPress={() => printReceipt(item, settings || undefined)} 
        />
        <IconButton 
          icon="share-variant" 
          size={18} 
          onPress={() => shareReceipt(item, settings || undefined)} 
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={settings?.farmName || "Harapan Broiler"} titleStyle={{color: 'white', fontWeight: 'bold'}} />
        {userRole === 'admin' && (
          <Appbar.Action icon="shield-account" color="white" onPress={() => navigation.navigate('Admin')} />
        )}
        <Appbar.Action icon="logout" color="white" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Input Timbangan Baru CTA - Prominent */}
        <View style={styles.ctaContainer}>
          <FAB
            style={styles.fabLarge}
            icon="plus"
            color="white"
            onPress={() => navigation.navigate('CreateNota')}
            label="INPUT TIMBANGAN BARU"
          />
        </View>

        {/* Aktivitas Terakhir - Collapsible */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AKTIVITAS TERAKHIR</Text>
          <IconButton
            icon={showActivities ? "chevron-up" : "chevron-down"}
            size={20}
            onPress={() => setShowActivities(!showActivities)}
          />
        </View>

        {showActivities && (
          <>
            {loading ? (
              <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
            ) : (
              sessions.slice(0, 10).map(session => (
                <View key={session.id} style={{marginBottom: 8}}>
                  {renderSessionItem({item: session})}
                </View>
              ))
            )}
          </>
        )}
        
        <View style={{height: 100}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  fabLarge: {
    backgroundColor: '#4CAF50',
    width: '100%',
    borderRadius: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 1,
    marginBottom: 2,
  },
  compactCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  compactCardRight: {
    alignItems: 'flex-end',
  },
  compactCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  compactCardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  compactCardDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  compactCardPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  compactCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
