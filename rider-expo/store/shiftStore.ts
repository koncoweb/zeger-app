import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Shift } from '@/lib/types';
import { getTodayDate } from '@/lib/utils';

interface ShiftState {
  activeShift: Shift | null;
  isShiftActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchActiveShift: (riderId: string) => Promise<void>;
  startShift: (riderId: string, branchId: string) => Promise<{ error: string | null }>;
  endShift: () => Promise<{ error: string | null }>;
  updateShiftStats: (sales: number, transactions: number) => Promise<void>;
  clearError: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: null,
  isShiftActive: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchActiveShift: async (riderId: string) => {
    try {
      set({ isLoading: true, error: null });

      const today = getTodayDate();
      const { data, error } = await supabase
        .from('shift_management')
        .select('*')
        .eq('rider_id', riderId)
        .eq('shift_date', today)
        .eq('status', 'active')
        .order('shift_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching shift:', error);
        set({ error: 'Gagal mengambil data shift' });
        return;
      }

      set({
        activeShift: data,
        isShiftActive: !!data,
      });
    } catch (error) {
      console.error('Error in fetchActiveShift:', error);
      set({ error: 'Terjadi kesalahan' });
    } finally {
      set({ isLoading: false });
    }
  },

  startShift: async (riderId: string, branchId: string) => {
    try {
      set({ isLoading: true, error: null });

      const today = getTodayDate();

      // Check if there's already an active shift
      const { data: existingShift } = await supabase
        .from('shift_management')
        .select('*')
        .eq('rider_id', riderId)
        .eq('shift_date', today)
        .eq('status', 'active')
        .maybeSingle();

      if (existingShift) {
        set({
          activeShift: existingShift,
          isShiftActive: true,
        });
        return { error: null };
      }

      // Get the next shift number for today
      const { data: lastShift } = await supabase
        .from('shift_management')
        .select('shift_number')
        .eq('rider_id', riderId)
        .eq('shift_date', today)
        .order('shift_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextShiftNumber = (lastShift?.shift_number || 0) + 1;

      // Create new shift
      const { data, error } = await supabase
        .from('shift_management')
        .insert({
          rider_id: riderId,
          branch_id: branchId,
          shift_date: today,
          shift_number: nextShiftNumber,
          shift_start_time: new Date().toISOString(),
          status: 'active',
          cash_collected: 0,
          total_sales: 0,
          total_transactions: 0,
          report_submitted: false,
          report_verified: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting shift:', error);
        set({ error: 'Gagal memulai shift' });
        return { error: 'Gagal memulai shift' };
      }

      set({
        activeShift: data,
        isShiftActive: true,
      });

      return { error: null };
    } catch (error) {
      console.error('Error in startShift:', error);
      set({ error: 'Terjadi kesalahan' });
      return { error: 'Terjadi kesalahan' };
    } finally {
      set({ isLoading: false });
    }
  },

  endShift: async () => {
    const { activeShift } = get();
    if (!activeShift) {
      return { error: 'Tidak ada shift aktif' };
    }

    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('shift_management')
        .update({
          shift_end_time: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', activeShift.id);

      if (error) {
        console.error('Error ending shift:', error);
        set({ error: 'Gagal mengakhiri shift' });
        return { error: 'Gagal mengakhiri shift' };
      }

      set({
        activeShift: null,
        isShiftActive: false,
      });

      return { error: null };
    } catch (error) {
      console.error('Error in endShift:', error);
      set({ error: 'Terjadi kesalahan' });
      return { error: 'Terjadi kesalahan' };
    } finally {
      set({ isLoading: false });
    }
  },

  updateShiftStats: async (sales: number, transactions: number) => {
    const { activeShift } = get();
    if (!activeShift) return;

    try {
      const newTotalSales = (activeShift.total_sales || 0) + sales;
      const newTotalTransactions = (activeShift.total_transactions || 0) + transactions;

      const { data, error } = await supabase
        .from('shift_management')
        .update({
          total_sales: newTotalSales,
          total_transactions: newTotalTransactions,
        })
        .eq('id', activeShift.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating shift stats:', error);
        return;
      }

      set({ activeShift: data });
    } catch (error) {
      console.error('Error in updateShiftStats:', error);
    }
  },
}));
