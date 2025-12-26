import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/ToastProvider';
import { supabase } from '@/lib/supabase';
import { formatDate, formatTime, getTodayDate } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import { Attendance } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function AttendanceScreen() {
  const { profile } = useAuthStore();
  const { getCurrentLocation } = useLocationStore();
  const toast = useToast();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!profile) return;

    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('work_date', today)
        .maybeSingle();

      if (error) throw error;
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Error', 'Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    if (!profile?.branch_id) return;

    setActionLoading(true);
    try {
      const location = await getCurrentLocation();
      const locationStr = location
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        : null;

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          rider_id: profile.id,
          branch_id: profile.branch_id,
          work_date: getTodayDate(),
          check_in_time: new Date().toISOString(),
          check_in_location: locationStr,
          status: 'checked_in',
        })
        .select()
        .single();

      if (error) throw error;
      setAttendance(data);
      toast.success('Sukses', 'Check-in berhasil');
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Error', 'Gagal melakukan check-in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance) return;

    setActionLoading(true);
    try {
      const location = await getCurrentLocation();
      const locationStr = location
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        : null;

      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: locationStr,
          status: 'checked_out',
        })
        .eq('id', attendance.id)
        .select()
        .single();

      if (error) throw error;
      setAttendance(data);
      toast.success('Sukses', 'Check-out berhasil');
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Error', 'Gagal melakukan check-out');
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();
  const hasCheckedIn = !!attendance?.check_in_time;
  const hasCheckedOut = !!attendance?.check_out_time;

  if (loading) {
    return <LoadingScreen message="Memuat data kehadiran..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Date & Time */}
        <Card style={styles.dateCard}>
          <Text style={styles.dateText}>{formatDate(now)}</Text>
          <Text style={styles.timeText}>{formatTime(now)}</Text>
        </Card>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={hasCheckedOut ? 'checkmark-circle' : hasCheckedIn ? 'time' : 'alert-circle'}
              size={48}
              color={hasCheckedOut ? COLORS.success : hasCheckedIn ? COLORS.warning : COLORS.gray[400]}
            />
            <Text style={styles.statusText}>
              {hasCheckedOut
                ? 'Sudah Check-out'
                : hasCheckedIn
                ? 'Sedang Bekerja'
                : 'Belum Check-in'}
            </Text>
          </View>

          {hasCheckedIn && (
            <View style={styles.attendanceInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Check-in</Text>
                <Text style={styles.infoValue}>
                  {formatTime(attendance!.check_in_time!)}
                </Text>
              </View>
              {attendance?.check_in_location && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lokasi Check-in</Text>
                  <Text style={styles.infoValue}>{attendance.check_in_location}</Text>
                </View>
              )}
              {hasCheckedOut && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Check-out</Text>
                    <Text style={styles.infoValue}>
                      {formatTime(attendance!.check_out_time!)}
                    </Text>
                  </View>
                  {attendance?.check_out_location && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Lokasi Check-out</Text>
                      <Text style={styles.infoValue}>{attendance.check_out_location}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </Card>

        {/* Action Button */}
        {!hasCheckedOut && (
          <Button
            title={hasCheckedIn ? 'Check-out' : 'Check-in'}
            onPress={hasCheckedIn ? handleCheckOut : handleCheckIn}
            loading={actionLoading}
            size="lg"
            variant={hasCheckedIn ? 'secondary' : 'primary'}
            icon={
              <Ionicons
                name={hasCheckedIn ? 'log-out-outline' : 'log-in-outline'}
                size={20}
                color={COLORS.white}
              />
            }
            style={styles.actionButton}
          />
        )}

        <Text style={styles.noteText}>
          Lokasi akan dicatat secara otomatis saat check-in dan check-out
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  content: { padding: 16 },
  dateCard: { alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 16, color: COLORS.gray[600] },
  timeText: { fontSize: 36, fontWeight: '700', color: COLORS.gray[900], marginTop: 4 },
  statusCard: { marginBottom: 24 },
  statusHeader: { alignItems: 'center', marginBottom: 16 },
  statusText: { fontSize: 18, fontWeight: '600', color: COLORS.gray[800], marginTop: 12 },
  attendanceInfo: { borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: COLORS.gray[500] },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.gray[900] },
  actionButton: { marginBottom: 16 },
  noteText: { fontSize: 12, color: COLORS.gray[400], textAlign: 'center' },
});
