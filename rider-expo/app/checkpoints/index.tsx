import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { supabase } from '@/lib/supabase';
import { formatTime, getTodayDate, openGoogleMaps } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { Checkpoint } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CheckpointsScreen() {
  const { profile } = useAuthStore();
  const { getCurrentLocation } = useLocationStore();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkpointNotes, setCheckpointNotes] = useState('');

  const fetchCheckpoints = useCallback(async () => {
    if (!profile) return;

    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('rider_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckpoints(data || []);
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCheckpoints();
    setRefreshing(false);
  }, [fetchCheckpoints]);

  const handleAddCheckpoint = async () => {
    if (!profile?.branch_id) return;
    if (!checkpointName.trim()) {
      Alert.alert('Error', 'Nama checkpoint harus diisi');
      return;
    }

    setSaving(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Tidak dapat mendapatkan lokasi');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('checkpoints').insert({
        rider_id: profile.id,
        branch_id: profile.branch_id,
        checkpoint_name: checkpointName.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        notes: checkpointNotes.trim() || null,
      });

      if (error) throw error;

      setShowModal(false);
      setCheckpointName('');
      setCheckpointNotes('');
      Alert.alert('Sukses', 'Checkpoint berhasil ditambahkan');
      fetchCheckpoints();
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      Alert.alert('Error', 'Gagal menambahkan checkpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenMaps = (checkpoint: Checkpoint) => {
    openGoogleMaps(Number(checkpoint.latitude), Number(checkpoint.longitude), checkpoint.checkpoint_name || undefined);
  };

  const renderCheckpoint = ({ item }: { item: Checkpoint }) => (
    <Card style={styles.checkpointCard}>
      <View style={styles.checkpointHeader}>
        <View style={styles.checkpointInfo}>
          <Text style={styles.checkpointName}>{item.checkpoint_name || 'Checkpoint'}</Text>
          <Text style={styles.checkpointTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Button
          title=""
          variant="outline"
          size="sm"
          onPress={() => handleOpenMaps(item)}
          icon={<Ionicons name="navigate-outline" size={18} color={COLORS.primary} />}
          style={styles.mapButton}
        />
      </View>
      {item.notes && <Text style={styles.checkpointNotes}>{item.notes}</Text>}
      <Text style={styles.coordinates}>
        {Number(item.latitude).toFixed(6)}, {Number(item.longitude).toFixed(6)}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {checkpoints.length} checkpoint hari ini
        </Text>
        <Button
          title="Tambah"
          size="sm"
          onPress={() => setShowModal(true)}
          icon={<Ionicons name="add" size={18} color={COLORS.white} />}
        />
      </View>

      {/* Checkpoints List */}
      <FlatList
        data={checkpoints}
        renderItem={renderCheckpoint}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Belum Ada Checkpoint</Text>
            <Text style={styles.emptyText}>Tambahkan checkpoint untuk mencatat lokasi Anda</Text>
          </View>
        }
      />

      {/* Add Checkpoint Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Checkpoint</Text>
              <Ionicons
                name="close"
                size={24}
                color={COLORS.gray[600]}
                onPress={() => setShowModal(false)}
              />
            </View>

            <Input
              label="Nama Lokasi"
              placeholder="Contoh: Warung Pak Budi"
              value={checkpointName}
              onChangeText={setCheckpointName}
            />

            <Input
              label="Catatan (Opsional)"
              placeholder="Tambahkan catatan..."
              value={checkpointNotes}
              onChangeText={setCheckpointNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />

            <Button
              title="Simpan Checkpoint"
              onPress={handleAddCheckpoint}
              loading={saving}
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  summaryText: { fontSize: 14, color: COLORS.gray[600] },
  listContent: { padding: 16, flexGrow: 1 },
  checkpointCard: { marginBottom: 12 },
  checkpointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  checkpointInfo: { flex: 1 },
  checkpointName: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  checkpointTime: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  mapButton: { paddingHorizontal: 12 },
  checkpointNotes: { fontSize: 14, color: COLORS.gray[600], marginTop: 8 },
  coordinates: { fontSize: 12, color: COLORS.gray[400], marginTop: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray[500], marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900] },
  notesInput: { height: 80, textAlignVertical: 'top' },
});
