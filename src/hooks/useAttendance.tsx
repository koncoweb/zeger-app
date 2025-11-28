import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePOSAuth } from './usePOSAuth';

interface Attendance {
  id: string;
  rider_id: string | null;
  branch_id: string | null;
  check_in_time: string | null;
  check_in_location: string | null;
  check_out_time: string | null;
  check_out_location: string | null;
  work_date: string | null;
  status: string | null;
}

interface UseAttendanceReturn {
  todayAttendance: Attendance | null;
  checkIn: (location: GeolocationPosition) => Promise<void>;
  checkOut: (location: GeolocationPosition) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export const useAttendance = (): UseAttendanceReturn => {
  const { profile } = usePOSAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch today's attendance record
  const fetchTodayAttendance = async () => {
    if (!profile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('work_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setTodayAttendance(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err);
    }
  };

  // Check in function
  const checkIn = async (location: GeolocationPosition) => {
    if (!profile?.id) {
      throw new Error('User profile tidak ditemukan');
    }

    setLoading(true);
    setError(null);

    try {
      const { latitude, longitude } = location.coords;
      const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      const today = new Date().toISOString().split('T')[0];

      const { data, error: insertError } = await supabase
        .from('attendance')
        .insert([{
          rider_id: profile.id,
          branch_id: profile.branch_id,
          check_in_time: new Date().toISOString(),
          check_in_location: locationString,
          work_date: today,
          status: 'checked_in'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setTodayAttendance(data);
    } catch (err: any) {
      console.error('Error checking in:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check out function
  const checkOut = async (location: GeolocationPosition) => {
    if (!profile?.id) {
      throw new Error('User profile tidak ditemukan');
    }

    if (!todayAttendance) {
      throw new Error('Anda belum melakukan check-in hari ini');
    }

    setLoading(true);
    setError(null);

    try {
      const { latitude, longitude } = location.coords;
      const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const { data, error: updateError } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: locationString,
          status: 'checked_out'
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTodayAttendance(data);
    } catch (err: any) {
      console.error('Error checking out:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance on mount and when profile changes
  useEffect(() => {
    fetchTodayAttendance();
  }, [profile?.id]);

  return {
    todayAttendance,
    checkIn,
    checkOut,
    loading,
    error
  };
};
