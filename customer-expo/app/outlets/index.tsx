import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { supabase, Branch } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { calculateDistance } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';

export default function OutletsScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const setSelectedOutlet = useCartStore((state) => state.setSelectedOutlet);
  
  const [outlets, setOutlets] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOutlets(data || []);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOutlets();
    setRefreshing(false);
  };

  const handleSelectOutlet = (outlet: Branch) => {
    setSelectedOutlet({
      id: outlet.id,
      name: outlet.name,
      address: outlet.address,
    });
    router.push('/menu' as any);
  };

  const getDistance = (outlet: Branch): string => {
    if (!location || !outlet.latitude || !outlet.longitude) {
      return '-';
    }
    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      outlet.latitude,
      outlet.longitude
    );
    return `${dist} km`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Outlet</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {outlets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Tidak Ada Outlet</Text>
            <Text style={styles.emptyText}>Outlet tidak tersedia saat ini</Text>
          </View>
        ) : (
          outlets.map((outlet) => (
            <TouchableOpacity
              key={outlet.id}
              style={styles.outletCard}
              onPress={() => handleSelectOutlet(outlet)}
            >
              <View style={styles.outletIcon}>
                <Ionicons name="storefront" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.outletInfo}>
                <Text style={styles.outletName}>{outlet.name}</Text>
                <Text style={styles.outletAddress} numberOfLines={2}>
                  {outlet.address}
                </Text>
                <View style={styles.outletMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location" size={14} color={COLORS.info} />
                    <Text style={styles.metaText}>{getDistance(outlet)}</Text>
                  </View>
                  {outlet.phone && (
                    <View style={styles.metaItem}>
                      <Ionicons name="call" size={14} color={COLORS.success} />
                      <Text style={styles.metaText}>{outlet.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  outletCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  outletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  outletName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  outletAddress: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  outletMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
});
